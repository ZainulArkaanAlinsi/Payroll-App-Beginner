<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Allowance;
use App\Models\Deduction;
use Livewire\WithPagination;

class EmployeeManagement extends Component
{
    use WithPagination;

    public $showEmployeeForm = false;
    public $showSalaryForm = false;
    public $showAllowanceForm = false;
    public $showDeductionForm = false;

    public $editMode = false;
    public $search = '';

    // Employee fields
    public $employeeId;
    public $full_name;
    public $phone;
    public $hire_date;
    public $position_id;
    public $bank_name;
    public $bank_account_number;
    public $npmp;
    public $address;

    // User fields
    public $name;
    public $email;
    public $password;
    public $role = 'employee';

    // Salary fields
    public $base_salary;
    public $pay_frequency = 'monthly';
    public $salary_effective_date;

    // Allowances & Deductions
    public $selected_allowances = [];
    public $allowance_amounts = [];
    public $selected_deductions = [];
    public $deduction_amounts = [];

    protected $rules = [
        'full_name' => 'required|string|max:255',
        'phone' => 'required|string|max:20',
        'hire_date' => 'required|date',
        'position_id' => 'required|exists:positions,id',
        'bank_name' => 'required|string|max:255',
        'bank_account_number' => 'required|string|max:50',
        'address' => 'required|string|max:500',

        // User validation
        'name' => 'required|string|max:255|unique:users,name',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:8',
        'role' => 'required|in:employee,admin',

        // Salary validation
        'base_salary' => 'required|numeric|min:0',
        'pay_frequency' => 'required|in:monthly,weekly,daily',
        'salary_effective_date' => 'required|date',
    ];

    public function render()
    {
        $employees = Employee::with(['position', 'user'])
            ->when($this->search, function ($query) {
                $query->where('full_name', 'like', '%' . $this->search . '%')
                    ->orWhere('phone', 'like', '%' . $this->search . '%')
                    ->orWhere('bank_account_number', 'like', '%' . $this->search . '%');
            })
            ->latest()
            ->paginate(10);

        return view('livewire.admin.employee-management', [
            'employees' => $employees,
            'positions' => Position::all(),
            'allowances' => Allowance::all(),
            'deductions' => Deduction::all(),
        ]);
    }

    public function showEmployeeForm($id = null)
    {
        $this->editMode = !is_null($id);

        if ($this->editMode) {
            $employee = Employee::findOrFail($id);
            $this->employeeId = $id;
            $this->fill($employee->toArray());

            if ($employee->user) {
                $this->fill($employee->user->toArray());
            }
        } else {
            $this->resetForm();
        }

        $this->showEmployeeForm = true;
    }

    public function saveEmployee()
    {
        $this->validate();

        $employeeData = [
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'hire_date' => $this->hire_date,
            'position_id' => $this->position_id,
            'bank_name' => $this->bank_name,
            'bank_account_number' => $this->bank_account_number,
            'npmp' => $this->npmp,
            'address' => $this->address,
        ];

        $userData = [
            'name' => $this->name,
            'email' => $this->email,
            'password' => bcrypt($this->password),
            'role' => $this->role,
        ];

        if ($this->editMode) {
            $employee = Employee::find($this->employeeId);
            $employee->update($employeeData);

            if ($employee->user) {
                $employee->user->update($userData);
            } else {
                $employee->user()->create($userData);
            }

            $this->emit('showToast', 'Employee updated successfully!');
        } else {
            $employee = Employee::create($employeeData);
            $employee->user()->create($userData);

            $this->emit('showToast', 'Employee created successfully!');
        }

        $this->showEmployeeForm = false;
        $this->resetForm();
    }

    public function showSalaryForm($id)
    {
        $this->employeeId = $id;
        $employee = Employee::findOrFail($id);

        if ($employee->salary) {
            $this->fill($employee->salary->toArray());
        }

        $this->showSalaryForm = true;
    }

    public function saveSalary()
    {
        $this->validate([
            'base_salary' => 'required|numeric|min:0',
            'pay_frequency' => 'required|in:monthly,weekly,daily',
            'salary_effective_date' => 'required|date',
        ]);

        $employee = Employee::find($this->employeeId);
        $employee->salary()->updateOrCreate(
            ['employee_id' => $this->employeeId],
            $this->only(['base_salary', 'pay_frequency', 'salary_effective_date'])
        );

        $this->showSalaryForm = false;
        $this->emit('showToast', 'Salary information saved!');
    }

    public function deleteEmployee($id)
    {
        Employee::find($id)->delete();
        $this->emit('showToast', 'Employee deleted successfully!');
    }

    private function resetForm()
    {
        $this->resetExcept('search', 'editMode');
        $this->resetErrorBag();
    }
}
