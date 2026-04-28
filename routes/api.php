<?php

use App\Http\Controllers\Api\ScanUploadController;
use Illuminate\Support\Facades\Route;

// Scanner watcher endpoints (token-protected)
Route::post('/scans/upload', [ScanUploadController::class, 'store'])->name('api.scans.upload');
Route::get('/scans/ping', [ScanUploadController::class, 'ping'])->name('api.scans.ping');
