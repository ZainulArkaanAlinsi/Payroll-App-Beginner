<?php

namespace App\Livewire;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\Overtime;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;
use Masmerise\Toaster\Toaster;

class TimeAttendance extends Component
{
    use WithPagination;
    public $selectedYearMonth = null;
    public $monthLinks = [];
    public function mount()
    {
        $this->generateMonthLinks();
    }
    public function generateMonthLinks()
    {
        $monthsData = Attendance::select(
            DB::raw("YEAR(attendance_date) as year"),
            DB::raw("MONTH(attendance_date) as month_number")
        )
            ->distinct()
            ->orderBy('year', 'desc')
            ->orderBy('month_number', 'desc')
            ->get();

        $this->monthLinks = []; // Reset before populating
        foreach ($monthsData as $data) {
            if ($data->year && $data->month_number) {
                try {
                    $date = Carbon::createFromDate($data->year, $data->month_number, 1);
                    $this->monthLinks[] = [
                        'value' => $date->format('Y-m'), // e.g., 2023-05
                        'display' => $date->format('F Y'), // e.g., May 2023
                    ];
                } catch (\Exception) {
                    $this->monthLinks[] = [
                        'value' => null,
                        'display' => 'Invalid Date',
                    ];
                }
            }
        }
    }
    public function applyMonthFilter($yearMonth)
    {
        $this->selectedYearMonth = $yearMonth;
        $this->resetPage('attendancesPage');
    }

    public function clearMonthFilter()
    {
        $this->selectedYearMonth = null;
        $this->resetPage('attendancesPage');
    }
    #[Title('Time & Attendance')]
    public function render()
    {
        $attendancesQuery = Attendance::query()->with('employee');

        if ($this->selectedYearMonth) {
            try {
                $year = Carbon::createFromFormat('Y-m', $this->selectedYearMonth)->year;
                $month = Carbon::createFromFormat('Y-m', $this->selectedYearMonth)->month;
                $attendancesQuery->whereYear('attendance_date', $year)
                    ->whereMonth('attendance_date', $month);
            } catch (\Exception) {
                $this->selectedYearMonth = null;
            }
        }

        $attendances = $attendancesQuery->orderBy('attendance_date', 'desc')->paginate(5, ['*'], 'attendancesPage');

        $overtimes = Overtime::latest()->paginate(5, ['*'], 'overtimesPage');
        $employees = Employee::latest()->get();

        return view('livewire.admin.time-attendance', [
            'attendances' => $attendances,
            'overtimes' => $overtimes,
            'monthLinks' => $this->monthLinks,
            'selectedYearMonthFilter' => $this->selectedYearMonth,
            'employees' => $employees
        ]);
    }


    // Overtimes
    public $isEditting = false;
    public $selectedEmployeeId = '';
    public $overtimeDate = '';
    public $startTime = '';
    public $endTime = '';
    public $reason = '';
    public $overtimeId = '';
    public function openOvertimeModal($selectedId = null)
    {
        if ($selectedId) {
            $this->isEditting = true;
            $overtime = Overtime::find($selectedId);
            $this->selectedEmployeeId = $overtime->employee_id;
            $this->overtimeDate = $overtime->overtime_date;
            $this->startTime = Carbon::parse($overtime->start_time)->format('H:i');
            $this->endTime = Carbon::parse($overtime->end_time)->format('H:i');
            $this->reason = $overtime->reason;
            $this->overtimeId = $overtime->id;
        } else {
            $this->isEditting = false;
        }
        $this->modal('overtime-modal')->show();
    }
    public function closeModal()
    {
        $this->reset([
            'isEditting',
            'selectedEmployeeId',
            'overtimeDate',
            'startTime',
            'endTime',
            'reason',
            'overtimeId'
        ]);
    }
    public function save()
    {
        $this->validate([
            'selectedEmployeeId' => 'required|exists:employees,id',
            'overtimeDate' => 'required|date',
            'startTime' => 'required|date_format:H:i',
            'endTime' => 'required|date_format:H:i|after:startTime',
            'reason' => 'required|string',
        ]);
        $duration = abs(Carbon::parse($this->endTime)->diffInMinutes(Carbon::parse($this->startTime)));
        if ($this->isEditting) {
            $overtime = Overtime::find($this->overtimeId);
            $overtime->update([
                'employee_id' => $this->selectedEmployeeId,
                'overtime_date' => $this->overtimeDate,
                'start_time' => $this->startTime,
                'end_time' => $this->endTime,
                'duration' => $duration,
                'reason' => $this->reason,
            ]);
        } else {
            Overtime::create([
                'employee_id' => $this->selectedEmployeeId,
                'overtime_date' => $this->overtimeDate,
                'start_time' => $this->startTime,
                'end_time' => $this->endTime,
                'duration' => $duration,
                'reason' => $this->reason,
            ]);
        }
        Toaster::success('Overtime saved successfully!');
        $this->modal('overtime-modal')->close();
        $this->closeModal();
        $this->resetPage('overtimesPage');
    }
    public function openDeleteOvertimeModal($selectedId)
    {
        $this->overtimeId = $selectedId;
        $this->modal('delete-modal')->show();
    }
    public function deleteOvertime()
    {
        $overtime = Overtime::find($this->overtimeId);
        $overtime->delete();
        Toaster::success('Overtime deleted successfully!');
        $this->modal('delete-modal')->close();
        $this->closeModal();
        $this->resetPage('overtimesPage');
    }
}
