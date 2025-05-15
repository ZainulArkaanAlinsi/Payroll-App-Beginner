<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

// app/Models/Tax.php
class Tax extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'rate',
        'threshold',
    ];

    protected $casts = [
        'rate' => 'decimal:2',
    ];
}

