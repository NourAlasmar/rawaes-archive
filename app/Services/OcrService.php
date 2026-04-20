<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class OcrService
{
    protected string $apiKey;
    protected string $endpoint = 'https://api.ocr.space/parse/image';

    public function __construct()
    {
        $this->apiKey = config('services.ocr.api_key', 'helloworld');
    }

    /**
     * Extract text from a file. Routes to OCR for images/PDF,
     * or direct text extraction for DOCX/TXT.
     */
    public function extract(string $filePath, string $language = 'ara'): ?string
    {
        if (!Storage::disk('local')->exists($filePath)) {
            Log::warning("OCR: file not found: {$filePath}");
            return null;
        }

        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        // Direct text extraction for Office docs
        if (in_array($ext, ['docx', 'doc'])) {
            return $this->extractFromWord($filePath);
        }

        if ($ext === 'txt') {
            return Storage::disk('local')->get($filePath);
        }

        // OCR for images and PDF
        try {
            $fullPath = Storage::disk('local')->path($filePath);
            $fileSize = filesize($fullPath);

            // OCR.space free tier: max 1MB per file
            if ($fileSize > 1024 * 1024) {
                Log::info("OCR: file too large ({$fileSize} bytes), skipping: {$filePath}");
                return null;
            }

            $response = Http::timeout(60)
                ->attach('file', file_get_contents($fullPath), basename($filePath))
                ->post($this->endpoint, [
                    'apikey' => $this->apiKey,
                    'language' => $language,
                    'isOverlayRequired' => 'false',
                    'detectOrientation' => 'true',
                    'scale' => 'true',
                    'OCREngine' => '2',
                ]);

            $data = $response->json();

            if (!empty($data['IsErroredOnProcessing'])) {
                Log::error('OCR error: ' . json_encode($data['ErrorMessage'] ?? []));
                return null;
            }

            $texts = [];
            foreach ($data['ParsedResults'] ?? [] as $result) {
                if (!empty($result['ParsedText'])) {
                    $texts[] = trim($result['ParsedText']);
                }
            }

            return $texts ? implode("\n\n", $texts) : null;
        } catch (\Throwable $e) {
            Log::error('OCR exception: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Extract text from DOCX/DOC using PhpWord.
     */
    protected function extractFromWord(string $filePath): ?string
    {
        try {
            $fullPath = Storage::disk('local')->path($filePath);
            $phpWord = \PhpOffice\PhpWord\IOFactory::load($fullPath);

            $text = [];
            foreach ($phpWord->getSections() as $section) {
                $this->walkElements($section->getElements(), $text);
            }

            return $text ? trim(implode("\n", $text)) : null;
        } catch (\Throwable $e) {
            Log::error('Word extraction error: ' . $e->getMessage());
            return null;
        }
    }

    protected function walkElements(array $elements, array &$text): void
    {
        foreach ($elements as $el) {
            if (method_exists($el, 'getText')) {
                $str = $el->getText();
                if (is_string($str) && trim($str) !== '') {
                    $text[] = $str;
                }
            }
            if (method_exists($el, 'getElements')) {
                $this->walkElements($el->getElements(), $text);
            }
        }
    }
}
