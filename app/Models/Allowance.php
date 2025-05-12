<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Allowance extends Model
{
    protected $guarded = [];
    protected $table = 'allowances';

    public function employeeAllowances()
    {
        return $this->hasMany(EmployeeAllowance::class);
    }
}
