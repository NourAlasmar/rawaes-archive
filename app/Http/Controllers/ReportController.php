<?php

namespace App\Http\Controllers;

use App\Models\ArchiveDocument;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $from = $request->from ?? now()->subMonths(3)->format('Y-m-d');
        $to = $request->to ?? now()->format('Y-m-d');
        $toFull = $to . ' 23:59:59';

        $uploadsTrend = ArchiveDocument::select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('count(*) as count'),
                DB::raw('SUM(file_size) as total_size')
            )
            ->whereBetween('created_at', [$from, $toFull])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $bySector = DB::table('archive_documents')
            ->join('sectors', 'sectors.id', '=', 'archive_documents.sector_id')
            ->select('sectors.name', DB::raw('count(*) as count'), DB::raw('SUM(archive_documents.file_size) as total_size'))
            ->whereBetween('archive_documents.created_at', [$from, $toFull])
            ->whereNull('archive_documents.deleted_at')
            ->groupBy('sectors.id', 'sectors.name')
            ->orderByDesc('count')
            ->get();

        $byType = DB::table('archive_documents')
            ->join('document_types', 'document_types.id', '=', 'archive_documents.document_type_id')
            ->select('document_types.name', DB::raw('count(*) as count'))
            ->whereBetween('archive_documents.created_at', [$from, $toFull])
            ->whereNull('archive_documents.deleted_at')
            ->groupBy('document_types.id', 'document_types.name')
            ->orderByDesc('count')
            ->get();

        $topUploaders = DB::table('archive_documents')
            ->join('users', 'users.id', '=', 'archive_documents.uploaded_by')
            ->select('users.name', DB::raw('count(*) as count'))
            ->whereBetween('archive_documents.created_at', [$from, $toFull])
            ->whereNull('archive_documents.deleted_at')
            ->groupBy('users.id', 'users.name')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        $activityCounts = AuditLog::select('action', DB::raw('count(*) as count'))
            ->whereBetween('created_at', [$from, $toFull])
            ->groupBy('action')
            ->get();

        $totals = [
            'documents' => ArchiveDocument::whereBetween('created_at', [$from, $toFull])->count(),
            'size' => (int) ArchiveDocument::whereBetween('created_at', [$from, $toFull])->sum('file_size'),
            'expired' => ArchiveDocument::expired()->count(),
            'expiring' => ArchiveDocument::expiringSoon(30)->count(),
        ];

        return Inertia::render('Reports/Index', [
            'filters' => ['from' => $from, 'to' => $to],
            'totals' => $totals,
            'uploadsTrend' => $uploadsTrend,
            'bySector' => $bySector,
            'byType' => $byType,
            'topUploaders' => $topUploaders,
            'activityCounts' => $activityCounts,
        ]);
    }

    public function export(Request $request)
    {
        $from = $request->from ?? now()->subMonths(3)->format('Y-m-d');
        $to = $request->to ?? now()->format('Y-m-d');

        $documents = ArchiveDocument::with(['sector:id,name', 'documentType:id,name', 'uploader:id,name'])
            ->whereBetween('created_at', [$from, $to . ' 23:59:59'])
            ->orderBy('created_at')
            ->get();

        $filename = "archive-report-{$from}-to-{$to}.csv";

        return new StreamedResponse(function () use ($documents) {
            $out = fopen('php://output', 'w');
            fputs($out, "\xEF\xBB\xBF"); // UTF-8 BOM

            fputcsv($out, [
                'ID', 'العنوان', 'رقم الوثيقة', 'القطاع', 'النوع',
                'الجهة المصدرة', 'تاريخ الإصدار', 'تاريخ الانتهاء',
                'الحالة', 'سري', 'الحجم', 'رفع بواسطة', 'تاريخ الرفع',
            ]);

            foreach ($documents as $doc) {
                fputcsv($out, [
                    $doc->id,
                    $doc->title,
                    $doc->document_number ?? '',
                    $doc->sector?->name ?? '',
                    $doc->documentType?->name ?? '',
                    $doc->issuing_entity ?? '',
                    $doc->issue_date?->format('Y-m-d') ?? '',
                    $doc->expiry_date?->format('Y-m-d') ?? '',
                    $doc->status,
                    $doc->is_confidential ? 'نعم' : 'لا',
                    $doc->file_size_formatted,
                    $doc->uploader?->name ?? '',
                    $doc->created_at?->format('Y-m-d H:i'),
                ]);
            }

            fclose($out);
        }, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
