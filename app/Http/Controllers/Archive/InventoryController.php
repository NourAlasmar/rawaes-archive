<?php

namespace App\Http\Controllers\Archive;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\DocumentFolder;
use App\Models\PhysicalFolder;
use App\Models\PhysicalFolderMovement;
use App\Models\Sector;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->can('inventory.view'), 403);

        $sectors = Sector::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'name_en']);

        // Physical folders (paper files) for inventory tracking
        $physicalFolders = PhysicalFolder::with(['sector', 'documentFolder'])
            ->orderBy('sector_id')
            ->orderBy('name')
            ->get([
                'id', 'sector_id', 'document_folder_id', 'name',
                'description', 'location',
                'qr_code', 'inventory_code', 'is_active',
                'is_checked_out', 'checked_out_to', 'checked_out_at', 'checked_out_notes',
            ]);

        // System folders tree is used only as optional classification
        $documentFolders = DocumentFolder::with(['sector', 'parent'])
            ->orderBy('sector_id')
            ->orderBy('parent_id')
            ->orderBy('name')
            ->get(['id', 'sector_id', 'parent_id', 'name', 'name_en']);

        return Inertia::render('Archive/Inventory/Index', [
            'sectors' => $sectors,
            'physicalFolders' => $physicalFolders,
            'documentFolders' => $documentFolders,
            'canManage' => (bool) $request->user()?->can('inventory.manage'),
        ]);
    }

    public function storeFolder(Request $request)
    {
        abort_unless($request->user()?->can('inventory.manage'), 403);

        $validated = $request->validate([
            'sector_id' => 'nullable|exists:sectors,id',
            'document_folder_id' => 'nullable|exists:document_folders,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'location' => 'nullable|string|max:255',
        ]);

        $folder = PhysicalFolder::create($validated);

        AuditLog::record('create_folder', $folder, [], $folder->toArray(), "إنشاء مجلد (الجرد): {$folder->name}");

        $folder->load(['sector:id,name,name_en', 'documentFolder:id,name,sector_id,parent_id']);

        return response()->json([
            'folder' => [
                'id' => $folder->id,
                'name' => $folder->name,
                'qr_code' => $folder->qr_code,
                'inventory_code' => $folder->inventory_code,
                'description' => $folder->description,
                'location' => $folder->location,
                'sector' => $folder->sector ? [
                    'id' => $folder->sector->id,
                    'name' => $folder->sector->name,
                    'name_en' => $folder->sector->name_en,
                ] : null,
                'document_folder' => $folder->documentFolder ? [
                    'id' => $folder->documentFolder->id,
                    'name' => $folder->documentFolder->name,
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

        $folder = PhysicalFolder::with(['sector:id,name,name_en', 'documentFolder:id,name,sector_id,parent_id'])
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
                'sector' => $folder->sector ? [
                    'id' => $folder->sector->id,
                    'name' => $folder->sector->name,
                ] : null,
                'document_folder' => $folder->documentFolder ? [
                    'id' => $folder->documentFolder->id,
                    'name' => $folder->documentFolder->name,
                ] : null,
                'location' => $folder->location,
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

        $folders = PhysicalFolder::with(['sector:id,name', 'documentFolder:id,name'])
            ->orderBy('sector_id')
            ->orderBy('name')
            ->get([
                'id', 'sector_id', 'document_folder_id', 'name',
                'description', 'location',
                'qr_code', 'inventory_code', 'is_active',
                'is_checked_out', 'checked_out_to', 'checked_out_at', 'checked_out_notes',
            ])
            ->map(function (PhysicalFolder $f) {
                return [
                    'id' => $f->id,
                    'sector_id' => $f->sector_id,
                    'document_folder_id' => $f->document_folder_id,
                    'name' => $f->name,
                    'description' => $f->description,
                    'location' => $f->location,
                    'inventory_code' => $f->inventory_code,
                    'qr_code' => $f->qr_code,
                    'is_active' => (bool) $f->is_active,
                    'is_checked_out' => (bool) $f->is_checked_out,
                    'checked_out_to' => $f->checked_out_to,
                    'checked_out_at' => $f->checked_out_at,
                    'checked_out_notes' => $f->checked_out_notes,
                    'sector' => $f->sector ? ['id' => $f->sector->id, 'name' => $f->sector->name] : null,
                    'document_folder' => $f->documentFolder ? ['id' => $f->documentFolder->id, 'name' => $f->documentFolder->name] : null,
                ];
            });

        return response()->json(['folders' => $folders], 200);
    }

    public function checkout(Request $request, PhysicalFolder $folder)
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

        PhysicalFolderMovement::create([
            'physical_folder_id' => $folder->id,
            'action' => 'checkout',
            'to_person' => $validated['to_person'],
            'notes' => $validated['notes'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        AuditLog::record('inventory_checkout', $folder, [], $folder->toArray(), "تسليم مجلد (الجرد): {$folder->name}");

        return response()->json(['folder' => $folder->fresh()], 200);
    }

    public function checkin(Request $request, PhysicalFolder $folder)
    {
        abort_unless($request->user()?->can('inventory.manage'), 403);

        $validated = $request->validate([
            'notes' => 'nullable|string',
        ]);

        if (!$folder->is_checked_out) {
            return response()->json(['message' => 'هذا المجلد غير مُسلّم حالياً'], 422);
        }

        PhysicalFolderMovement::create([
            'physical_folder_id' => $folder->id,
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

    public function movements(Request $request)
    {
        abort_unless($request->user()?->can('inventory.view'), 403);

        $validated = $request->validate([
            'q' => 'nullable|string|max:255',
            'action' => 'nullable|in:checkout,checkin',
            'per_page' => 'nullable|integer|min:5|max:200',
        ]);

        $perPage = (int) ($validated['per_page'] ?? 50);
        $q = trim((string) ($validated['q'] ?? ''));
        $action = $validated['action'] ?? null;

        $query = PhysicalFolderMovement::query()
            ->with([
                'physicalFolder:id,name,inventory_code,sector_id,location',
                'physicalFolder.sector:id,name',
                'creator:id,name',
            ])
            ->latest();

        if ($action) {
            $query->where('action', $action);
        }

        if ($q !== '') {
            $query->where(function ($sub) use ($q) {
                $sub->where('to_person', 'like', "%{$q}%")
                    ->orWhere('notes', 'like', "%{$q}%")
                    ->orWhereHas('creator', fn($u) => $u->where('name', 'like', "%{$q}%"))
                    ->orWhereHas('physicalFolder', function ($f) use ($q) {
                        $f->where('name', 'like', "%{$q}%")
                          ->orWhere('inventory_code', 'like', "%{$q}%")
                          ->orWhere('location', 'like', "%{$q}%");
                    });
            });
        }

        $movements = $query->paginate($perPage)->through(function (PhysicalFolderMovement $m) {
            return [
                'id' => $m->id,
                'action' => $m->action,
                'to_person' => $m->to_person,
                'notes' => $m->notes,
                'created_at' => $m->created_at,
                'created_by' => $m->creator ? ['id' => $m->creator->id, 'name' => $m->creator->name] : null,
                'folder' => $m->physicalFolder ? [
                    'id' => $m->physicalFolder->id,
                    'name' => $m->physicalFolder->name,
                    'inventory_code' => $m->physicalFolder->inventory_code,
                    'location' => $m->physicalFolder->location,
                    'sector' => $m->physicalFolder->sector ? [
                        'id' => $m->physicalFolder->sector->id,
                        'name' => $m->physicalFolder->sector->name,
                    ] : null,
                ] : null,
            ];
        });

        return response()->json(['movements' => $movements], 200);
    }
}
