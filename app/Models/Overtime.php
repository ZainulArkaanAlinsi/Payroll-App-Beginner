<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Overtime extends Model
{

    protected $appends = ['status_color'];
    protected $fillable = [
        'employee_id',
        'overtime_date',
        'start_time',
        'end_time',
        'duration',
        'reason',
    ];

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
