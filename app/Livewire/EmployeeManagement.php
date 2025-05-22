<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Employee;
use App\Models\Position;
use App\Models\Allowance;
use App\Models\Deduction;
use App\Models\Department;
use Livewire\WithPagination;
use Illuminate\Support\Facades\DB;




class EmployeeManagement extends Component
{
    use WithPagination;

    public $showEmployeeForm = false;
    public $showSalaryForm = false;
    public $showAllowanceForm = false;
    public $showDeductionForm = false;

    public $editMode = false;
    public $search = '';
    public $departments;



    // Employee fields
    public $employeeId;
    public $full_name;
    public $phone;
    public $hire_date;
    public $position_id = '';
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
    public $amount;
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
        'bank_name' => 'required|string|max:255',
        'bank_account_number' => 'required|string|max:50',
        'address' => 'required|string|max:500',
        'name' => 'required|string|max:255|unique:users,name',
        'email' => 'required|email|unique:users,email',
        'password' => 'required|min:8',
        'role' => 'required|in:employee,admin',
        'amount' => 'required|numeric|min:0',
        'pay_frequency' => 'required|in:monthly,weekly,daily',
        'salary_effective_date' => 'required|date',
        'position_id' => 'required|exists:positions;id',
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

    public function mount()
    {
        $this->departments = Department::with('positions')->get();
        $this->showEmployeeForm = false;
    }

    public function showEmployeeForm($id = null)
    {
        $this->resetForm();

        $this->editMode = false;
        $this->employeeId = null;

        if ($id) {
            $employee = Employee::with(['user', 'salary'])->findOrFail($id);

            $this->employeeId = $employee->id;
            $this->full_name = $employee->full_name;
            $this->phone = $employee->phone;
            $this->hire_date = $employee->hire_date;
            $this->position_id = $employee->position_id;
            $this->bank_name = $employee->bank_name;
            $this->bank_account_number = $employee->bank_account_number;
            $this->npmp = $employee->npmp;
            $this->address = $employee->address;

            if ($employee->user) {
                $this->name = $employee->user->name;
                $this->email = $employee->user->email;
                $this->role = $employee->user->role;
                // Password intentionally left blank for security
            }

            if ($employee->salary) {
                $this->amount = $employee->salary->amount ?? null;
                $this->pay_frequency = $employee->salary->pay_frequency ?? 'monthly';
                $this->salary_effective_date = $employee->salary->salary_effective_date ?? null;
            }

            $this->editMode = true;
        }

        $this->showEmployeeForm = true;
    }

    public function saveEmployee()
    {


        $employee = null;
        $userId = null;

        if ($this->editMode && $this->employeeId) {
            $employee = Employee::with('user')->find($this->employeeId);
            $userId = $employee && $employee->user ? $employee->user->id : null;
        }


        $validationRules = [
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'hire_date' => 'required|date',
            'position_id' => 'required|exists:positions,id',
            'bank_name' => 'required|string|max:255',
            'bank_account_number' => 'required|string|max:50',
            'address' => 'required|string|max:500',
            'name' => $this->editMode && $userId
                ? "required|string|max:255|unique:users,name,{$userId}"
                : "required|string|max:255|unique:users,name",
            'email' => $this->editMode && $userId
                ? "required|email|unique:users,email,{$userId}"
                : "required|email|unique:users,email",
            'password' => $this->editMode ? 'nullable|min:8' : 'required|min:8',
            'role' => 'required|in:employee,admin',
            'amount' => 'required|numeric|min:0',
            'pay_frequency' => 'required|in:monthly,weekly,daily',
            'salary_effective_date' => 'required|date',
        ];



        $validated = $this->validate($validationRules);

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
            'role' => $this->role,
        ];

        // Only update password if it's provided (in edit mode) or required (create mode)
        if ($this->password) {
            $userData['password'] = bcrypt($this->password);
        }

        $salaryData = [
            'amount' => $this->amount,
            'pay_frequency' => $this->pay_frequency,
            'effective_date' => $this->salary_effective_date,
        ];

        DB::beginTransaction();

        try {
            // Create or update employee
            if ($this->editMode) {
                $employee = Employee::find($this->employeeId);
                $employee->update($employeeData);

                if ($employee->user) {
                    $employee->user->update($userData);
                } else {
                    $employee->user()->create($userData);
                }

                // Update or create salary
                $employee->salary()->updateOrCreate(
                    ['employee_id' => $this->employeeId],
                    $salaryData
                );

                $this->dispatch('showToast', ['message' => 'Employee updated successfully!', 'type' => 'success']);
            } else {
                $employee = Employee::create($employeeData);
                $employee->user()->create($userData);
                $employee->salary()->create($salaryData);

                $this->dispatch('showToast', ['message' => 'Employee created successfully!', 'type' => 'success']);
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();

            $this->dispatch('showToast', ['message' => 'Error saving employee: ' . $e->getMessage(), 'type' => 'error']);
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
            'amount' => 'required|numeric|min:0',
            'pay_frequency' => 'required|in:monthly,weekly,daily',
            'salary_effective_date' => 'required|date',
        ]);

        $employee = Employee::find($this->employeeId);
        $employee->salary()->updateOrCreate(
            ['employee_id' => $this->employeeId],
            $this->only(['amount', 'pay_frequency', 'salary_effective_date'])
        );

        $this->showSalaryForm = false;
        $this->dispatch('showToast', ['message' => 'Salary updated successfully!', 'type' => 'success']);
    }

    public function deleteEmployee($id)
    {
        Employee::find($id)->delete();
        $this->dispatch('showToast', ['message' => 'Employee deleted successfully!', 'type' => 'success']);
    }

    private function resetForm()
    {
        $this->reset([
            'employeeId',
            'full_name',
            'phone',
            'hire_date',
            'position_id',
            'bank_name',
            'bank_account_number',
            'address',
            'name',
            'email',
            'password',
            'role',
            'amount',
            'npmp',
            'pay_frequency',
            'salary_effective_date',
            'showEmployeeForm',
            'editMode'
        ]);
        $this->resetErrorBag();
    }

    public function editEmployee($id)
    {
        $this->employeeId = $id;
        $employee = Employee::findOrFail($id);

        $this->full_name = $employee->full_name;
        $this->phone = $employee->phone;
        $this->hire_date = $employee->hire_date;
        $this->position_id = $employee->position_id;
        $this->bank_name = $employee->bank_name;
        $this->bank_account_number = $employee->bank_account_number;
        $this->address = $employee->address;

        if ($employee->user) {
            $this->name = $employee->user->name;
            $this->email = $employee->user->email;
            // Password intentionally left blank for security
        }

        if ($employee->salary) {
            $this->amount = $employee->salary->amount ?? null;
            $this->pay_frequency = $employee->salary->pay_frequency ?? 'monthly';
            $this->salary_effective_date = $employee->salary->salary_effective_date ?? null;
        }

        // Show the form
        $this->showEmployeeForm = true;
        $this->editMode = true;
    }
}
