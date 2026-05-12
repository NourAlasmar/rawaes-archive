<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class DocumentFolder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sector_id', 'parent_id', 'name', 'name_en',
        'qr_code',
        'description', 'icon', 'color', 'sort_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

    protected static function booted(): void
    {
        static::creating(function (self $folder) {
            if (!$folder->qr_code) {
                $folder->qr_code = (string) Str::uuid();
            }
        });
    }

    public function sector(): BelongsTo
    {
        return $this->belongsTo(Sector::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(DocumentFolder::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(DocumentFolder::class, 'parent_id')->orderBy('sort_order');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ArchiveDocument::class, 'folder_id');
    }

    public function getPathAttribute(): string
    {
        $parts = [];
        $folder = $this;
        while ($folder) {
            array_unshift($parts, $folder->name);
            $folder = $folder->parent;
        }
        return implode(' / ', $parts);
    }
}
