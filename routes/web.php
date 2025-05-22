<?php

use App\Livewire\Admin\LeaveRequests;
use Illuminate\Support\Facades\Route;
use Livewire\Volt\Volt;
use App\Livewire\CompanySetting;
use App\Livewire\LeaveRequestForm;
use App\Livewire\LeaveRequests as LivewireLeaveRequests;
use App\Livewire\SalaryComponent;
use App\Livewire\TaxSetting;





Route::redirect('/', 'dashboard')->name('home');

Route::view('dashboard', 'dashboard')
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', 'settings/profile');
    Route::get('leave-requests', LivewireLeaveRequests::class)->name('leave-requests');
    Route::get('leave-request-form', LeaveRequestForm::class)->name('leave-request-form');

    Volt::route('settings/profile', 'settings.profile')->name('settings.profile');
    Volt::route('settings/password', 'settings.password')->name('settings.password');
    Volt::route('settings/appearance', 'settings.appearance')->name('settings.appearance');
});



//Admin Routes
Route::middleware(['auth', 'admin'])->name('admin.')->group(function () {
    Route::get('company-settings', CompanySetting::class)->name('company-settings');
    Route::get('leave-requests-admin', LeaveRequests::class)->name('leave-requests-admin');
    Route::view('departments-and-positions', 'admin.departments-and-positions')->name('departments-and-positions');
    Route::get('salary-component', SalaryComponent::class)->name('salary-components');
    Route::get('tax-setting', TaxSetting::class)->name('tax-settings');
});

require __DIR__ . '/auth.php';
