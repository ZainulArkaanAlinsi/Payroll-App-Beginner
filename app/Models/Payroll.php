<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $guarded = [];

    public function payrollDetails()
    {
        return $this->hasMany(PayrollDetail::class);
    }
}
