<?php

use App\Http\Controllers\Api\ScanUploadController;
use App\Http\Controllers\Api\DocumentUploadController;
use Illuminate\Support\Facades\Route;

// Scanner watcher endpoints (token-protected)
Route::post('/scans/upload', [ScanUploadController::class, 'store'])->name('api.scans.upload');
Route::get('/scans/ping', [ScanUploadController::class, 'ping'])->name('api.scans.ping');

// External integrations (Sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/documents', [DocumentUploadController::class, 'store'])->name('api.documents.store');
    Route::get('/documents/{document}/download', [DocumentUploadController::class, 'download'])->name('api.documents.download');
});
