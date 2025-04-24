<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deduction extends Model
{
    protected $guarded = [];

    public function employeeDeductions()
    {
        return $this->hasMany(EmployeeDeduction::class);
    }
}
