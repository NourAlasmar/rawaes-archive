<?php

namespace App\Http\Controllers\Archive;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DocumentFolder;
use App\Models\Sector;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('inventory.view'), 403);

        $sectors = Sector::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'name_en']);

        $folders = DocumentFolder::with(['sector', 'parent'])
            ->orderBy('sector_id')
            ->orderBy('parent_id')
            ->orderBy('name')
            ->get(['id', 'sector_id', 'parent_id', 'name', 'name_en', 'qr_code', 'is_active']);

        return Inertia::render('Archive/Inventory/Index', [
            'sectors' => $sectors,
            'folders' => $folders,
        ]);
    }

    public function storeFolder(Request $request)
    {
        abort_unless($request->user()?->can('folders.manage'), 403);

        $validated = $request->validate([
            'sector_id' => 'required|exists:sectors,id',
            'parent_id' => 'nullable|exists:document_folders,id',
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);

        $folder = DocumentFolder::create([
            ...$validated,
            'qr_code' => (string) Str::uuid(),
        ]);

        AuditLog::record('create_folder', $folder, [], $folder->toArray(), "إنشاء مجلد (الجرد): {$folder->name}");

        $folder->load(['sector:id,name,name_en', 'parent:id,name']);

        return response()->json([
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'name_en' => $folder->name_en,
                'qr_code' => $folder->qr_code,
                'sector' => $folder->sector ? [
                    'id' => $folder->sector->id,
                    'name' => $folder->sector->name,
                    'name_en' => $folder->sector->name_en,
                ] : null,
                'parent' => $folder->parent ? [
                    'id' => $folder->parent->id,
                    'name' => $folder->parent->name,
                ] : null,
            ],
        ], 201);
    }

    public function lookup(Request $request)
    {
        abort_unless($request->user()?->can('inventory.view'), 403);

        $validated = $request->validate([
            'code' => 'required|string|max:255',
        ]);

        $folder = DocumentFolder::with(['sector:id,name,name_en', 'parent:id,name,parent_id'])
            ->where('qr_code', $validated['code'])
            ->first();

        if (!$folder) {
            return response()->json(['found' => false], 200);
        }

        return response()->json([
            'found' => true,
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'path' => $folder->path,
                'sector' => $folder->sector ? [
                    'id' => $folder->sector->id,
                    'name' => $folder->sector->name,
                ] : null,
                'is_active' => (bool) $folder->is_active,
            ],
        ], 200);
    }
}
