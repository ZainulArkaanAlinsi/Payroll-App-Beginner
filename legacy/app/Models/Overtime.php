<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Overtime extends Model
{

    protected $casts = [
        'overtime_date' => 'date',      // Cast ke objek Carbon (tanggal)
        'start_time' => 'datetime:H:i', // Cast ke waktu (contoh: "14:30")
        'end_time' => 'datetime:H:i',   // Cast ke waktu
    ];

    protected $fillable = [
        'employee_id',
        'overtime_date',
        'start_time',
        'end_time',
        'duration',
        'reason',
        'status'
    ];

    protected $appends = ['status_color'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getStatusColorAttribute()
    {
        return match ($this->status) {
            'pending' => 'yellow',
            'approved' => 'green',
            'rejected' => 'red',
            default => 'gray'
        };
    }
}
