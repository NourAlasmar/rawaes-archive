<?php

namespace App\Http\Controllers\Archive;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DocumentFolder;
use App\Models\DocumentFolderMovement;
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
            ->get([
                'id', 'sector_id', 'parent_id', 'name', 'name_en',
                'qr_code', 'inventory_code', 'is_active',
                'is_checked_out', 'checked_out_to', 'checked_out_at', 'checked_out_notes',
            ]);

        return Inertia::render('Archive/Inventory/Index', [
            'sectors' => $sectors,
            'folders' => $folders,
            'canManage' => (bool) $request->user()?->can('inventory.manage'),
        ]);
    }

    public function storeFolder(Request $request)
    {
        abort_unless($request->user()?->can('inventory.manage'), 403);

        $validated = $request->validate([
            'sector_id' => 'required|exists:sectors,id',
            'parent_id' => 'nullable|exists:document_folders,id',
            'name' => 'required|string|max:255',
            'name_en' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
        ]);

        $folder = DocumentFolder::create($validated);

        AuditLog::record('create_folder', $folder, [], $folder->toArray(), "إنشاء مجلد (الجرد): {$folder->name}");

        $folder->load(['sector:id,name,name_en', 'parent:id,name']);

        return response()->json([
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'name_en' => $folder->name_en,
                'qr_code' => $folder->qr_code,
                'inventory_code' => $folder->inventory_code,
                'sector' => $folder->sector ? [
                    'id' => $folder->sector->id,
                    'name' => $folder->sector->name,
                    'name_en' => $folder->sector->name_en,
                ] : null,
                'parent' => $folder->parent ? [
                    'id' => $folder->parent->id,
                    'name' => $folder->parent->name,
                ] : null,
                'is_active' => (bool) $folder->is_active,
                'is_checked_out' => (bool) $folder->is_checked_out,
                'checked_out_to' => $folder->checked_out_to,
                'checked_out_at' => $folder->checked_out_at,
                'checked_out_notes' => $folder->checked_out_notes,
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
            ->where(function ($q) use ($validated) {
                $q->where('inventory_code', $validated['code'])
                  ->orWhere('qr_code', $validated['code']);
            })
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
                'is_checked_out' => (bool) $folder->is_checked_out,
                'checked_out_to' => $folder->checked_out_to,
                'checked_out_at' => $folder->checked_out_at,
                'checked_out_notes' => $folder->checked_out_notes,
            ],
        ], 200);
    }

    public function list(Request $request)
    {
        abort_unless($request->user()?->can('inventory.view'), 403);

        $folders = DocumentFolder::with(['sector:id,name', 'parent:id,name'])
            ->orderBy('sector_id')
            ->orderBy('parent_id')
            ->orderBy('name')
            ->get([
                'id', 'sector_id', 'parent_id', 'name', 'name_en',
                'qr_code', 'inventory_code', 'is_active',
                'is_checked_out', 'checked_out_to', 'checked_out_at', 'checked_out_notes',
            ])
            ->map(function (DocumentFolder $f) {
                return [
                    'id' => $f->id,
                    'sector_id' => $f->sector_id,
                    'parent_id' => $f->parent_id,
                    'name' => $f->name,
                    'path' => $f->path,
                    'inventory_code' => $f->inventory_code,
                    'qr_code' => $f->qr_code,
                    'is_active' => (bool) $f->is_active,
                    'is_checked_out' => (bool) $f->is_checked_out,
                    'checked_out_to' => $f->checked_out_to,
                    'checked_out_at' => $f->checked_out_at,
                    'checked_out_notes' => $f->checked_out_notes,
                    'sector' => $f->sector ? ['id' => $f->sector->id, 'name' => $f->sector->name] : null,
                ];
            });

        return response()->json(['folders' => $folders], 200);
    }

    public function checkout(Request $request, DocumentFolder $folder)
    {
        abort_unless($request->user()?->can('inventory.manage'), 403);

        $validated = $request->validate([
            'to_person' => 'required|string|max:255',
            'notes' => 'nullable|string',
        ]);

        if ($folder->is_checked_out) {
            return response()->json(['message' => 'هذا المجلد مُسلّم بالفعل'], 422);
        }

        $folder->forceFill([
            'is_checked_out' => true,
            'checked_out_to' => $validated['to_person'],
            'checked_out_by' => $request->user()?->id,
            'checked_out_at' => now(),
            'checked_out_notes' => $validated['notes'] ?? null,
        ])->save();

        DocumentFolderMovement::create([
            'folder_id' => $folder->id,
            'action' => 'checkout',
            'to_person' => $validated['to_person'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        AuditLog::record('inventory_checkout', $folder, [], $folder->toArray(), "تسليم مجلد (الجرد): {$folder->name}");

        return response()->json(['folder' => $folder->fresh()], 200);
    }

    public function checkin(Request $request, DocumentFolder $folder)
    {
        abort_unless($request->user()?->can('inventory.manage'), 403);

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        if (!$folder->is_checked_out) {
            return response()->json(['message' => 'هذا المجلد غير مُسلّم حالياً'], 422);
        }

        DocumentFolderMovement::create([
            'folder_id' => $folder->id,
            'action' => 'checkin',
            'to_person' => $folder->checked_out_to,
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $folder->forceFill([
            'is_checked_out' => false,
            'checked_out_to' => null,
            'checked_out_by' => null,
            'checked_out_at' => null,
            'checked_out_notes' => $validated['notes'] ?? null,
        ])->save();

        AuditLog::record('inventory_checkin', $folder, [], $folder->toArray(), "استلام مجلد (الجرد): {$folder->name}");

        return response()->json(['folder' => $folder->fresh()], 200);
    }
}
