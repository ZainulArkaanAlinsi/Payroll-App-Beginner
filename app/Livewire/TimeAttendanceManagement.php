<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Attendance;
use App\Models\Overtime;
use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TimeAttendanceManagement extends Component
{
    // Attendance Properties
    public $attendances;
    public $currentAttendance;
    public $attendanceDate;
    public $checkIn;
    public $checkOut;
    public $notes;

    // Overtime Properties
    public $overtimes;
    public $overtimeDate;
    public $startTime;
    public $endTime;
    public $reason;
    public $selectedOvertime;
    public $showCreateModal = false;
    public $showingDetailModal = false;
    public $employeeId;

    public $activeTab = 'attendance';
    public $isAdmin = false;

    public function mount()
    {
        $this->isAdmin = Auth::user()->hasRole('admin');
        $this->loadData();
    }

    public function loadData()
    {
        if ($this->isAdmin) {
            $this->attendances = Attendance::with('employee')->latest()->get();
            $this->overtimes = Overtime::with('employee')->latest()->get();
        } else {
            $employee = Employee::where('user_id', Auth::id())->first();
            $this->attendances = Attendance::where('employee_id', $employee->id)->latest()->get();
            $this->overtimes = Overtime::where('employee_id', $employee->id)->latest()->get();
        }
    }

    public function createOvertime()
    {
        $this->validate([
            'overtimeDate' => 'required|date',
            'startTime' => 'required|date_format:H:i',
            'endTime' => 'required|date_format:H:i|after:startTime',
            'reason' => 'required|string|max:255',
            'employeeId' => $this->isAdmin ? 'required|exists:employees,id' : '',
        ]);

        $employeeId = $this->isAdmin
            ? $this->employeeId
            : Employee::where('user_id', Auth::id())->value('id');


        $start = Carbon::parse($this->startTime);
        $end = Carbon::parse($this->endTime);
        $duration = $end->diffInHours($start);

        Overtime::create([
            'employee_id' => $employeeId,
            'overtime_date' => Carbon::parse($this->overtimeDate)->toDateString(),
            'start_time' => $this->startTime,
            'end_time' => $this->endTime,
            'duration' => $duration,
            'reason' => $this->reason,
        ]);

        $this->resetOvertimeForm();
        $this->loadData();
        $this->showCreateModal = false;
    }

    private function resetOvertimeForm()
    {
        $this->reset(['overtimeDate', 'startTime', 'endTime', 'reason']);
    }

    public function switchTab($tab)
    {
        $this->activeTab = $tab;
    }
    public function render()
    {
        if ($this->isAdmin) {
            return view('livewire.admin.time-attendance-management');
        }
        // return view('livewire.user-employee.time-attendance-management');
    }
    public function showOvertimeDetail($overtimeId)
    {
        $this->selectedOvertime = Overtime::with('employee')->find($overtimeId);
        $this->showingDetailModal = true;
    }
}
