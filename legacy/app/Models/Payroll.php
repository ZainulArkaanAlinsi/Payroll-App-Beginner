<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payroll extends Model
{
    protected $table = 'payrolls';

    public function payroll_details()
    {
        return $this->hasMany(PayrollDetail::class);
    }
}
