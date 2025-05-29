<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Allowance extends Model
{
    use HasFactory;
    protected $guarded = [];
    protected $table = 'allowances';

    public function employeeAllowances()
    {
        return $this->hasMany(EmployeeAllowance::class);
    }
}
