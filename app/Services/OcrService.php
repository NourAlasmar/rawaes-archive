<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Process\Process;

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

            // If OCR.space key isn't configured (default demo key), use local OCR directly.
            if (empty($this->apiKey) || $this->apiKey === 'helloworld') {
                return $this->extractLocally($fullPath, $ext, $language);
            }

            // Prefer local OCR for large files to avoid OCR.space free-tier limits.
            if ($fileSize > 1024 * 1024) {
                return $this->extractLocally($fullPath, $ext, $language);
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
                // Remote rejected params/file; fallback to local OCR.
                return $this->extractLocally($fullPath, $ext, $language);
            }

            $texts = [];
            foreach ($data['ParsedResults'] ?? [] as $result) {
                if (!empty($result['ParsedText'])) {
                    $texts[] = trim($result['ParsedText']);
                }
            }

            $remote = $texts ? implode("\n\n", $texts) : null;
            if ($remote) return $remote;

            // Fallback to local OCR if remote returns no text.
            return $this->extractLocally($fullPath, $ext, $language);
        } catch (\Throwable $e) {
            Log::error('OCR exception: ' . $e->getMessage());
            // Fallback to local OCR on remote failures.
            try {
                $fullPath = Storage::disk('local')->path($filePath);
                return $this->extractLocally($fullPath, $ext, $language);
            } catch (\Throwable $e2) {
                Log::error('OCR local fallback exception: ' . $e2->getMessage());
                return null;
            }
        }
    }

    protected function extractLocally(string $fullPath, string $ext, string $language): ?string
    {
        $lang = $this->mapLanguage($language);
        $maxPages = (int) (config('services.ocr.max_pages') ?? 10);

        if ($ext === 'pdf') {
            return $this->extractFromPdfWithTesseract($fullPath, $lang, $maxPages);
        }

        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'tif', 'webp'])) {
            return $this->extractFromImageWithTesseract($fullPath, $lang);
        }

        return null;
    }

    protected function extractFromImageWithTesseract(string $fullPath, string $lang): ?string
    {
        $p = new Process(['tesseract', $fullPath, 'stdout', '-l', $lang, '--psm', '3']);
        $p->setTimeout(120);
        $p->run();

        if (!$p->isSuccessful()) {
            Log::error('OCR(tesseract image) failed: ' . $p->getErrorOutput());
            return null;
        }

        $text = trim($p->getOutput());
        return $text !== '' ? $text : null;
    }

    protected function extractFromPdfWithTesseract(string $fullPath, string $lang, int $maxPages): ?string
    {
        $tmpDir = storage_path('app/ocr_tmp/' . uniqid('pdf_', true));
        if (!is_dir($tmpDir) && !mkdir($tmpDir, 0775, true) && !is_dir($tmpDir)) {
            Log::error("OCR: cannot create tmp dir: {$tmpDir}");
            return null;
        }

        try {
            $prefix = $tmpDir . '/page';
            // Convert first N pages to PNG using poppler (pdftoppm).
            $convert = new Process(['pdftoppm', '-f', '1', '-l', (string) max(1, $maxPages), '-png', $fullPath, $prefix]);
            $convert->setTimeout(180);
            $convert->run();

            if (!$convert->isSuccessful()) {
                Log::error('OCR(pdftoppm) failed: ' . $convert->getErrorOutput());
                return null;
            }

            $images = glob($tmpDir . '/page-*.png') ?: [];
            sort($images);
            if (empty($images)) return null;

            $texts = [];
            foreach ($images as $img) {
                $p = new Process(['tesseract', $img, 'stdout', '-l', $lang, '--psm', '3']);
                $p->setTimeout(120);
                $p->run();
                if ($p->isSuccessful()) {
                    $t = trim($p->getOutput());
                    if ($t !== '') $texts[] = $t;
                } else {
                    Log::warning('OCR(tesseract pdf page) failed: ' . $p->getErrorOutput());
                }
            }

            return $texts ? implode("\n\n", $texts) : null;
        } finally {
            foreach (glob($tmpDir . '/*') ?: [] as $f) @unlink($f);
            @rmdir($tmpDir);
        }
    }

    protected function mapLanguage(string $language): string
    {
        $lang = strtolower(trim($language));
        // For mixed documents, adding English improves recognition of numbers/latin.
        if ($lang === 'ara') return 'ara+eng';
        if ($lang === 'eng') return 'eng';
        return 'ara+eng';
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
