<?php

use App\Http\Controllers\Archive\AuditLogController;
use App\Http\Controllers\Archive\DocumentController;
use App\Http\Controllers\Archive\DocumentTypeController;
use App\Http\Controllers\Archive\FolderController;
use App\Http\Controllers\Archive\InventoryController;
use App\Http\Controllers\Archive\SectorController;
use App\Http\Controllers\Archive\TrashController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', fn() => redirect()->route('archive.documents.index'));


Route::get('/dashboard', [\App\Http\Controllers\DashboardController::class, 'index'])
    ->middleware(['auth'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('users', \App\Http\Controllers\UserController::class);

    // Roles & Permissions
    Route::get('/roles', [\App\Http\Controllers\RolePermissionController::class, 'index'])->name('roles.index');
    Route::post('/roles', [\App\Http\Controllers\RolePermissionController::class, 'storeRole'])->name('roles.store');
    Route::put('/roles/{role}/permissions', [\App\Http\Controllers\RolePermissionController::class, 'updatePermissions'])->name('roles.permissions');
    Route::delete('/roles/{role}', [\App\Http\Controllers\RolePermissionController::class, 'destroyRole'])->name('roles.destroy');

    // Notifications
    Route::get('/notifications', [\App\Http\Controllers\NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/api/notifications/unread', [\App\Http\Controllers\NotificationController::class, 'unread']);
    Route::post('/notifications/{id}/read', [\App\Http\Controllers\NotificationController::class, 'markAsRead'])->name('notifications.read');
    Route::post('/notifications/read-all', [\App\Http\Controllers\NotificationController::class, 'markAllAsRead'])->name('notifications.readAll');
    Route::delete('/notifications/{id}', [\App\Http\Controllers\NotificationController::class, 'destroy'])->name('notifications.destroy');

    // Reports
    Route::get('/reports', [\App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [\App\Http\Controllers\ReportController::class, 'export'])->name('reports.export');
});

Route::prefix('archive')->name('archive.')->middleware(['auth'])->group(function () {
    Route::get('/documents', [DocumentController::class, 'index'])->name('documents.index');
    Route::get('/documents/create', [DocumentController::class, 'create'])->name('documents.create');
    Route::post('/documents', [DocumentController::class, 'store'])->name('documents.store');
    Route::get('/documents/{document}', [DocumentController::class, 'show'])->name('documents.show');
    Route::get('/documents/{document}/edit', [DocumentController::class, 'edit'])->name('documents.edit');
    Route::put('/documents/{document}', [DocumentController::class, 'update'])->name('documents.update');
    Route::delete('/documents/{document}', [DocumentController::class, 'destroy'])->name('documents.destroy');
    Route::get('/documents/{document}/download', [DocumentController::class, 'download'])->name('documents.download');
    Route::get('/documents/{document}/preview', [DocumentController::class, 'preview'])->name('documents.preview');
    Route::post('/documents/{document}/ocr', [DocumentController::class, 'runOcr'])->name('documents.ocr');
    Route::post('/documents/{document}/email', [DocumentController::class, 'email'])->name('documents.email');

    // Trash (soft-deleted documents)
    Route::get('/trash/documents', [TrashController::class, 'index'])->name('documents.trash');
    Route::put('/trash/documents/{id}/restore', [TrashController::class, 'restore'])->name('documents.restore');
    Route::delete('/trash/documents/{id}', [TrashController::class, 'forceDestroy'])->name('documents.forceDelete');

    // Scan Inbox
    Route::get('/scans', [\App\Http\Controllers\Archive\ScanInboxController::class, 'index'])->name('scans.index');
    Route::get('/scans/{pendingScan}', [\App\Http\Controllers\Archive\ScanInboxController::class, 'show'])->name('scans.show');
    Route::get('/scans/{pendingScan}/preview', [\App\Http\Controllers\Archive\ScanInboxController::class, 'preview'])->name('scans.preview');
    Route::post('/scans/{pendingScan}/assign', [\App\Http\Controllers\Archive\ScanInboxController::class, 'assign'])->name('scans.assign');
    Route::delete('/scans/{pendingScan}', [\App\Http\Controllers\Archive\ScanInboxController::class, 'destroy'])->name('scans.destroy');

    Route::get('/folders', [FolderController::class, 'index'])->name('folders.index');
    Route::post('/folders', [FolderController::class, 'store'])->name('folders.store');
    Route::put('/folders/{folder}', [FolderController::class, 'update'])->name('folders.update');
    Route::delete('/folders/{folder}', [FolderController::class, 'destroy'])->name('folders.destroy');
    Route::get('/api/folders/tree', [FolderController::class, 'tree'])->name('folders.tree');

    // Inventory (Physical archive QR verification)
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('/inventory/folders', [InventoryController::class, 'storeFolder'])->name('inventory.folders.store');
    Route::get('/api/inventory/lookup', [InventoryController::class, 'lookup'])->name('inventory.lookup');
    Route::get('/api/inventory/folders', [InventoryController::class, 'list'])->name('inventory.folders.list');
    Route::post('/api/inventory/folders/{folder}/checkout', [InventoryController::class, 'checkout'])->name('inventory.folders.checkout');
    Route::post('/api/inventory/folders/{folder}/checkin', [InventoryController::class, 'checkin'])->name('inventory.folders.checkin');

    Route::resource('sectors', SectorController::class);
    Route::resource('document-types', DocumentTypeController::class);
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit.index');
    Route::get('/audit-logs/export', [AuditLogController::class, 'export'])->name('audit.export');
});

require __DIR__ . '/auth.php';
