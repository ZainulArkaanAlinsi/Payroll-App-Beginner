<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $guarded = [];

    protected $fillable = [
        'full_name',
        'phone',
        'hire_date',
        'position_id',
        'bank_name',
        'bank_account_number',
        'npmp',
        'address',
    ];


    public function user()
    {
        return $this->hasOne(User::class, 'employee_id', 'id');
    }

    public function salary()
    {
        return $this->hasOne(Salary::class);
    }

    public function employeeAllowance()
    {
        return $this->hasMany(EmployeeAllowance::class);
    }

    public function employeeDeduction()
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    public function attendance()
    {
        return $this->hasMany(Attendance::class);
    }


    public function overtimes()
    {
        return $this->hasMany(Overtime::class);
    }

    public function leaveRequests()
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function position()
    {
        return $this->belongsTo(Position::class);
    }
}
