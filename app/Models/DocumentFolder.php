<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocumentFolder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'sector_id', 'parent_id', 'name', 'name_en',
        'description', 'icon', 'color', 'sort_order', 'is_active',
    ];

    protected $casts = ['is_active' => 'boolean'];

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
