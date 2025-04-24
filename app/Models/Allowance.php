<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Allowance extends Model
{
    protected $guarded = [];

    public function employeeAllowances()
    {
        return $this->hasMany(EmployeeAllowance::class);
    }
}
