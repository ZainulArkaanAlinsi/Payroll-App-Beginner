<?php

use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;
use App\Livewire\CompanySetting;
use App\Livewire\SalaryComponent;
use App\Livewire\TaxSetting;
use App\Livewire\EmployeeManagement;
use App\Livewire\PayrollEmployee;
use App\Livewire\TimeAttendanceManagement;

Route::redirect('/', 'dashboard')->name('home');

Route::view('dashboard', 'dashboard')
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', 'settings/profile');
    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
    Volt::route('settings/password', 'settings.password')->name('settings.password');
    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
});

// Admin Routes
Route::middleware(['auth', 'admin'])->name('admin.')->group(function () {

    // Existing admin routes
    Route::get('company-settings', CompanySetting::class)->name('company-settings');
    Route::view('departments-and-positions', 'admin.departments-and-positions')->name('departments-and-positions');
    Route::get('salary-components', SalaryComponent::class)->name('salary-components');
    Route::get('tax-settings', TaxSetting::class)->name('tax-settings');
    Route::get('employee-management', EmployeeManagement::class)->name('employee-management');
    Route::get('payroll-employee', PayrollEmployee::class)->name('payroll-employee');
    Route::get('time-attendance-management',   TimeAttendanceManagement::class)->name('time-attendance-management');
});


// // Employee Routes
// Route::middleware(['auth', 'user-employee'])->name('employee.')->group(function () {
//     Route::get('time-attendance-management', TimeAttendanceManagement::class)->name('time-attendance-management');
// });




require __DIR__ . '/auth.php';
