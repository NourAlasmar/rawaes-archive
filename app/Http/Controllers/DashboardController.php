<?php

namespace App\Http\Controllers;

use App\Models\ArchiveDocument;
use App\Models\AuditLog;
use App\Models\DocumentFolder;
use App\Models\DocumentType;
use App\Models\Sector;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $totalDocs = ArchiveDocument::count();
        $expiringSoon = ArchiveDocument::expiringSoon(30)->count();
        $expired = ArchiveDocument::expired()->count();
        $confidential = ArchiveDocument::where('is_confidential', true)->count();

        // Total file size
        $totalSize = (int) ArchiveDocument::sum('file_size');

        // By sector
        $bySector = ArchiveDocument::select('sector_id', DB::raw('count(*) as count'))
            ->with('sector:id,name')
            ->groupBy('sector_id')
            ->get()
            ->map(fn($row) => [
                'name' => $row->sector?->name ?? 'غير محدد',
                'count' => $row->count,
            ]);

        // By document type
        $byType = ArchiveDocument::select('document_type_id', DB::raw('count(*) as count'))
            ->with('documentType:id,name')
            ->groupBy('document_type_id')
            ->get()
            ->map(fn($row) => [
                'name' => $row->documentType?->name ?? 'غير محدد',
                'count' => $row->count,
            ]);

        // Last 30 days trend
        $trend = ArchiveDocument::select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $recent = ArchiveDocument::with(['sector:id,name', 'documentType:id,name', 'uploader:id,name'])
            ->latest()
            ->take(6)
            ->get();

        $expiringList = ArchiveDocument::expiringSoon(30)
            ->with(['sector:id,name', 'documentType:id,name'])
            ->orderBy('expiry_date')
            ->take(5)
            ->get();

        $recentActivity = AuditLog::with('user:id,name')
            ->latest('created_at')
            ->take(8)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total' => $totalDocs,
                'expiring_soon' => $expiringSoon,
                'expired' => $expired,
                'confidential' => $confidential,
                'total_size' => $totalSize,
                'sectors' => Sector::count(),
                'folders' => DocumentFolder::count(),
                'types' => DocumentType::count(),
                'users' => User::count(),
            ],
            'bySector' => $bySector,
            'byType' => $byType,
            'trend' => $trend,
            'recent' => $recent,
            'expiringList' => $expiringList,
            'recentActivity' => $recentActivity,
        ]);
    }
}
