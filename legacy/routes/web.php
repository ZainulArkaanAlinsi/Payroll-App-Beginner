<?php

use App\Livewire\Admin\LeaveRequests;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;
use App\Livewire\CompanySetting;
use App\Livewire\LeaveRequestForm;
use App\Livewire\LeaveRequests as LivewireLeaveRequests;
use App\Livewire\SalaryComponent;
use App\Livewire\TaxSetting;
use App\Livewire\EmployeeManagement;
use App\Livewire\PayrollEmployee;
use App\Livewire\TimeAttendance;

Route::redirect('/', 'dashboard')->name('home');

// Fixed dashboard route - uses view() instead of Route::view()
Route::get('dashboard', function () {
    return view('dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', 'settings/profile');

    Route::get('leave-requests', LivewireLeaveRequests::class)->name('leave-requests');
    Route::get('leave-request-form', LeaveRequestForm::class)->name('leave-request-form');
    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
    Volt::route('settings/password', 'settings.password')->name('settings.password');
    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
});

// Admin Routes
Route::middleware(['auth', 'role:admin'])->name('admin.')->group(function () {
    Route::get('company-setting', CompanySetting::class)->name('company-setting');
    Route::get('leave-requests-admin', LeaveRequests::class)->name('leave-requests-admin');
    Route::view('departments-and-positions', 'admin.departments-and-positions')->name('departments-and-positions');
    Route::get('salary-components', SalaryComponent::class)->name('salary-component');
    Route::get('tax-settings', TaxSetting::class)->name('tax-setting');
    Route::get('employee-management', EmployeeManagement::class)->name('employee-management');
    Route::get('payroll-employee', PayrollEmployee::class)->name('payroll-employee'); // Updated name
    Route::get('time-attendance', TimeAttendance::class)->name('time-attendance');
});



//Employee Routes


require __DIR__ . '/auth.php';
