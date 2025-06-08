<?php

namespace App\Livewire;

use App\Models\Allowance;
use App\Models\CompanySetting;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\Payroll as PayrollModel;
use App\Models\PayrollDetail;
use App\Models\Tax;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Support\Facades\DB;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;
use Masmerise\Toaster\Toaster;

class PayrollEmployee extends Component
{
    use WithPagination;

    public $periodStart = '';
    public $periodEnd = '';
    public $paymentDate = '';
    public $notes = '';
    public $isEditing = false;
    public $selectedPayrollId = '';

    public $selectedAllowances = [];
    public $selectedDeductions = [];

    // Dashboard metrics
    public $totalEmployees = 0;
    public $percentagePaid = 0;
    public $totalPayroll = 0;
    public $employeesByLevel = [];
    public $averageSalary = 0;

    #[Title('Payroll Management')]
    public function mount()
    {
        $this->fetchDashboardData();
    }

    private function fetchDashboardData()
    {
        try {
            $this->totalEmployees = Employee::count();
            $this->totalPayroll = PayrollModel::count(); // Changed to singular


            // Calculate percentage paid
            $totalDetails = PayrollDetail::count();
            $paidDetails = PayrollDetail::where('payment_status', 'paid')->count();

            $this->percentagePaid = $totalDetails > 0
                ? round(($paidDetails / $totalDetails) * 100, 2)
                : 0;

            // Get employees by level
            $this->employeesByLevel = Employee::select('level', DB::raw('count(*) as total'))
                ->groupBy('level')
                ->get()
                ->toArray();

            // Calculate average salary
            $this->averageSalary = Employee::has('salary')->avg('salary.amount') ?? 0;
        } catch (\Exception $e) {
            // Initialize all properties with default values
            $this->totalEmployees = 0;
            $this->totalPayroll = 0;
            $this->percentagePaid = 0;
            $this->employeesByLevel = [];
            $this->averageSalary = 0;
        }
    }

    public function render()
    {
        return view('livewire.admin.payroll-employee', [
            'payrolls' => PayrollModel::withCount('payroll_details')
                ->latest()
                ->paginate(10),
            'allowances' => Allowance::all(),
            'deductions' => Deduction::all(),
            'isEditing' => $this->isEditing, // Explicitly pass to view
        ]);
    }

    public function closeModal()
    {
        $this->reset();
        $this->resetValidation();
        $this->isEditing = false; // Ensure reset
    }

    public function openModal($id = null)
    {
        if ($id) {
            $this->selectedPayrollId = $id;
            $this->isEditing = true;
            $payroll = PayrollModel::findOrFail($id);
            $this->periodStart = $payroll->payroll_period_start;
            $this->periodEnd = $payroll->payroll_period_end;
            $this->paymentDate = $payroll->payment_date;
            $this->notes = $payroll->notes;
        } else {
            $this->isEditing = false;
        }
        $this->dispatch('open-modal', name: 'main-modal');
    }

    public function save()
    {
        if (is_array($this->notes)) {
            $this->notes = implode(' ', $this->notes);
        }

        $this->validate([
            'periodStart' => 'required|date',
            'periodEnd' => 'required|date|after_or_equal:periodStart',
            'paymentDate' => 'required|date|after_or_equal:periodEnd',
            'notes' => 'nullable|string|max:255',
        ]);

        $data = [
            'payroll_period_start' => $this->periodStart,
            'payroll_period_end' => $this->periodEnd,
            'payment_date' => $this->paymentDate,
            'notes' => $this->notes,
        ];

        if ($this->isEditing) {
            $payroll = PayrollModel::findOrFail($this->selectedPayrollId);
            $payroll->update($data);
            Toaster::success('Payroll updated successfully!');
        } else {
            PayrollModel::create($data);
            Toaster::success('Payroll created successfully!');
        }

        $this->closeModal();
        $this->dispatch('close-modal', name: 'main-modal');
    }

    public function openDeleteModal($id)
    {
        $this->selectedPayrollId = $id;
        $this->dispatch('open-modal', name: 'delete-modal');
    }

    public function delete()
    {
        $payroll = PayrollModel::find($this->selectedPayrollId);

        if ($payroll) {
            // Prevent deletion if payroll details exist
            if ($payroll->payroll_details()->exists()) {
                Toaster::error('Cannot delete payroll with generated details!');
                $this->closeModal();
                return;
            }

            $payroll->delete();
            Toaster::success('Payroll deleted successfully!');
        } else {
            Toaster::error('Payroll not found!');
        }

        $this->closeModal();
        $this->dispatch('close-modal', name: 'delete-modal');
    }

    public function openGenerateModal($id)
    {
        $this->selectedPayrollId = $id;
        $payroll = PayrollModel::findOrFail($id);

        $this->periodStart = $payroll->payroll_period_start;
        $this->periodEnd = $payroll->payroll_period_end;
        $this->paymentDate = $payroll->payment_date;
        $this->notes = $payroll->notes;

        $this->dispatch('open-modal', name: 'generate-modal');
    }

    public function generate()
    {
        $this->validate([
            'selectedAllowances' => 'array|exists:allowances,id',
            'selectedDeductions' => 'array|exists:deductions,id',
        ]);

        try {
            $payroll = PayrollModel::findOrFail($this->selectedPayrollId);
            $companySetting = CompanySetting::firstOrFail();

            // Clear existing details if any
            PayrollDetail::where('payroll_id', $payroll->id)->delete();

            // Get employee data with salary
            $employees = Employee::with('salary')->get();

            if ($employees->isEmpty()) {
                throw new \Exception('No employees found to generate payroll details');
            }

            // Prepare allowances and deductions
            $fixedAllowances = Allowance::where('rule', 'fixed')
                ->whereIn('id', $this->selectedAllowances)
                ->get();

            $percentageAllowances = Allowance::where('rule', 'percentage')
                ->whereIn('id', $this->selectedAllowances)
                ->get();

            $deductions = Deduction::whereIn('id', $this->selectedDeductions)->get();

            // Get required deduction types
            $lateDeduction = Deduction::where('name', 'Late Arrival')->firstOrFail();
            $absenceDeduction = Deduction::where('name', 'Absence Without Notice')->firstOrFail();
            $unapprovedLeaveDeduction = Deduction::where('name', 'Unapproved Leave')->firstOrFail();

            // Prepare taxes with improved threshold parsing
            $taxes = Tax::all()->map(function ($tax) {
                $threshold = $tax->threshold;

                if (str_contains($threshold, '-')) {
                    [$min, $max] = explode('-', $threshold);
                } elseif (str_contains($threshold, '>')) {
                    $min = (float) str_replace('>', '', $threshold);
                    $max = null;
                } else {
                    $min = 0;
                    $max = (float) $threshold;
                }

                return [
                    'min' => (float) $min,
                    'max' => $max ? (float) $max : null,
                    'rate' => $tax->rate / 100, // Convert percentage to decimal
                ];
            });

            DB::beginTransaction();

            foreach ($employees as $employee) {
                // Skip employees without salary records
                if (!$employee->salary) continue;

                $basicSalary = $employee->salary->amount;
                $totalAllowances = 0;

                // Calculate fixed allowances
                foreach ($fixedAllowances as $allowance) {
                    $totalAllowances += $allowance->amount;
                }

                // Calculate percentage allowances
                foreach ($percentageAllowances as $allowance) {
                    $totalAllowances += $basicSalary * ($allowance->amount / 100);
                }

                $grossSalary = $basicSalary + $totalAllowances;

                // Calculate deductions based on attendance
                $deductionAmounts = $this->calculateAttendanceDeductions(
                    $employee,
                    $payroll,
                    $companySetting,
                    $lateDeduction,
                    $absenceDeduction,
                    $unapprovedLeaveDeduction
                );

                // Calculate other selected deductions
                $otherDeductions = $deductions->sum('amount');

                $totalDeductions = $deductionAmounts['late']
                    + $deductionAmounts['absence']
                    + $deductionAmounts['unapproved_leave']
                    + $otherDeductions;

                // Calculate taxes
                $taxableIncome = max(0, $grossSalary - $totalDeductions);
                $totalTaxes = $this->calculateTaxes($taxableIncome, $taxes);

                $netSalary = $grossSalary - $totalDeductions - $totalTaxes;

                // Create payroll detail
                PayrollDetail::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $employee->id,
                    'basic_salary' => $basicSalary,
                    'total_allowances' => $totalAllowances,
                    'gross_salary' => $grossSalary,
                    'total_deductions' => $totalDeductions,
                    'total_taxes' => $totalTaxes,
                    'net_salary' => $netSalary,
                    'payment_status' => 'unpaid',
                ]);
            }

            DB::commit();
            Toaster::success('Payroll details generated successfully!');
            $this->dispatch('close-modal', name: 'generate-modal');
        } catch (\Exception $e) {
            DB::rollBack();
            Toaster::error('Error: ' . $e->getMessage());
        }
    }

    private function calculateAttendanceDeductions(
        $employee,
        $payroll,
        $companySetting,
        $lateDeduction,
        $absenceDeduction,
        $unapprovedLeaveDeduction
    ) {
        $deductions = [
            'late' => 0,
            'absence' => 0,
            'unapproved_leave' => 0
        ];

        // 1. Calculate late arrivals
        $lateCount = $employee->attendances()
            ->whereBetween('attendance_date', [
                $payroll->payroll_period_start,
                $payroll->payroll_period_end
            ])
            ->whereNotNull('check_in')
            ->whereTime('check_in', '>', $companySetting->check_in_time)
            ->count();

        $deductions['late'] = $lateCount * $lateDeduction->amount;

        // 2. Calculate absences
        $workingDays = $this->getWorkingDays(
            $payroll->payroll_period_start,
            $payroll->payroll_period_end,
            $companySetting->working_days
        );

        $presentDays = $employee->attendances()
            ->whereIn('attendance_date', $workingDays)
            ->count();

        $approvedLeaveDays = $employee->leaveRequests()
            ->where('status', 'approved')
            ->where(function ($query) use ($payroll) {
                $query->whereBetween('start_date', [
                    $payroll->payroll_period_start,
                    $payroll->payroll_period_end
                ])
                    ->orWhereBetween('end_date', [
                        $payroll->payroll_period_start,
                        $payroll->payroll_period_end
                    ]);
            })
            ->get()
            ->sum(function ($leave) use ($payroll, $workingDays) {
                $start = max($leave->start_date, $payroll->payroll_period_start);
                $end = min($leave->end_date, $payroll->payroll_period_end);

                $days = 0;
                $current = Carbon::parse($start);
                $endDate = Carbon::parse($end);

                while ($current <= $endDate) {
                    if (in_array($current->toDateString(), $workingDays)) {
                        $days++;
                    }
                    $current->addDay();
                }

                return $days;
            });

        $expectedDays = count($workingDays);
        $absentDays = $expectedDays - $presentDays - $approvedLeaveDays;

        $deductions['absence'] = $absentDays * $absenceDeduction->amount;

        // 3. Calculate unapproved leave days
        $unapprovedLeaveDays = $employee->leaveRequests()
            ->whereIn('status', ['pending', 'rejected'])
            ->where(function ($query) use ($payroll) {
                $query->whereBetween('start_date', [
                    $payroll->payroll_period_start,
                    $payroll->payroll_period_end
                ])
                    ->orWhereBetween('end_date', [
                        $payroll->payroll_period_start,
                        $payroll->payroll_period_end
                    ]);
            })
            ->get()
            ->sum(function ($leave) use ($workingDays) {
                $start = Carbon::parse($leave->start_date);
                $end = Carbon::parse($leave->end_date);

                $days = 0;
                $current = $start->copy();

                while ($current <= $end) {
                    if (in_array($current->toDateString(), $workingDays)) {
                        $days++;
                    }
                    $current->addDay();
                }

                return $days;
            });

        $deductions['unapproved_leave'] = $unapprovedLeaveDays * $unapprovedLeaveDeduction->amount;

        return $deductions;
    }

    private function getWorkingDays($start, $end, $workingDaysSetting)
    {
        $start = Carbon::parse($start);
        $end = Carbon::parse($end);
        $workingDays = [];

        $daysOfWeek = [
            5 => [Carbon::MONDAY, Carbon::TUESDAY, Carbon::WEDNESDAY, Carbon::THURSDAY, Carbon::FRIDAY],
            6 => [Carbon::MONDAY, Carbon::TUESDAY, Carbon::WEDNESDAY, Carbon::THURSDAY, Carbon::FRIDAY, Carbon::SATURDAY],
            7 => range(0, 6)
        ];

        $period = CarbonPeriod::create($start, $end);

        foreach ($period as $date) {
            if (in_array($date->dayOfWeek, $daysOfWeek[$workingDaysSetting] ?? [])) {
                $workingDays[] = $date->toDateString();
            }
        }

        return $workingDays;
    }

    private function calculateTaxes($taxableIncome, $taxBrackets)
    {
        $tax = 0;
        $remainingIncome = $taxableIncome;

        foreach ($taxBrackets as $bracket) {
            if ($remainingIncome <= 0) break;

            if ($bracket['max'] === null) {
                // Last bracket with no upper limit
                $tax += $remainingIncome * $bracket['rate'];
                break;
            }

            $bracketRange = $bracket['max'] - $bracket['min'];
            $bracketAmount = min($remainingIncome, $bracketRange);
            $tax += $bracketAmount * $bracket['rate'];
            $remainingIncome -= $bracketAmount;
        }

        return $tax;
    }
}
