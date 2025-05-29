<?php

namespace App\Livewire;

use Illuminate\Support\Facades\Auth;
use Livewire\Component;
use Masmerise\Toaster\Toaster;

class ClockInOut extends Component
{
    public $todayAttendance;

    public function mount()
    {
        $todayAttendanceData = Auth::user()->employee->attendances()
            ->whereDate('attendance_date', now())
            ->first();

        if ($todayAttendanceData) {
            $this->todayAttendance = $todayAttendanceData;
        } else {
            $this->todayAttendance = null;
        }
    }

    public function render()
    {
        return view('livewire.employee.clock-in-out');
    }
    public function clockIn()
    {
        try {

            if ($this->todayAttendance) {
                Toaster::error('You have already clocked in today.');
                return;
            }
            $createdAttendance = $this->todayAttendance = Auth::user()->employee->attendances()->create([
                'attendance_date' => now(),
                'check_in' => now(),
            ]);

            if ($createdAttendance) {
                $this->getTodayAttendance();
                Toaster::success('Clocked in successfully!');
            }
        } catch (\Exception $e) {
            Toaster::error('Failed to clock in: ' . $e->getMessage());
        } finally {
            $this->getTodayAttendance();
        }
    }
    public function clockOut()
    {
        try {
            if ($this->todayAttendance) {
                if ($this->todayAttendance->check_out) {
                    Toaster::error('You have already clocked out today.');
                    return;
                }
                $this->todayAttendance->update([
                    'check_out' => now(),
                ]);
                Toaster::success('Clocked out successfully!');
            } else {
                Toaster::error('You have not clocked in yet today.');
            }
        } catch (\Exception $e) {
            Toaster::error('Failed to clock out: ' . $e->getMessage());
        } finally {
            $this->getTodayAttendance();
        }
    }
    public function getTodayAttendance()
    {
        $this->todayAttendance = Auth::user()->employee->attendances()
            ->whereDate('attendance_date', now())
            ->first();
    }
}
