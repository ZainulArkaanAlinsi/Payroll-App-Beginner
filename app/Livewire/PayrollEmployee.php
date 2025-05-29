<?php

namespace App\Livewire;

use App\Models\Allowance;
use App\Models\Deduction;
use App\Models\Payroll as ModelsPayroll;
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
    public $isEditting = false;
    public $selectedPayrollId = '';
    public $search = '';
    public $filterStart = '';
    public $filterEnd = '';
    public $loading = false;
    public $totalAmount = 0;
    public $selectedAllowances = [];
    public $selectedDeductions = [];
    public $showMainModal = false;
    public $showDeleteModal = false;
    public $showGenerateModal = false;

    #[Title('Payroll Management')]
    protected $queryString = [
        'search' => ['except' => ''],
        'filterStart' => ['except' => ''],
        'filterEnd' => ['except' => ''],
    ];

    public function updatingSearch()
    {
        $this->resetPage();
    }

    public function updatingFilterStart()
    {
        $this->resetPage();
    }

    public function updatingFilterEnd()
    {
        $this->resetPage();
    }

    public function render()
    {
        $query = ModelsPayroll::query();

        if ($this->search) {
            $query->where('notes', 'like', '%' . $this->search . '%');
        }
        if ($this->filterStart) {
            $query->where('payroll_period_start', '>=', $this->filterStart);
        }
        if ($this->filterEnd) {
            $query->where('payroll_period_end', '<=', $this->filterEnd);
        }

        return view('livewire.admin.payroll-employee', [
            'payrolls' => $query->latest()->paginate(10),
            'allowances' => Allowance::all(),
            'deductions' => Deduction::all(),
            'totalAmount' => $this->calculateTotalAmount(),
            'loading' => $this->loading,
        ]);
    }

    public function closeModal()
    {
        $this->reset(['periodStart', 'periodEnd', 'paymentDate', 'notes', 'isEditting', 'selectedPayrollId', 'selectedAllowances', 'selectedDeductions']);
        $this->showMainModal = false;
        $this->showDeleteModal = false;
        $this->showGenerateModal = false;
    }

    public function openModal($id = null)
    {
        $this->loading = true;
        if ($id) {
            $this->selectedPayrollId = $id;
            $this->isEditting = true;
            $payroll = ModelsPayroll::find($id);
            $this->periodStart = $payroll->payroll_period_start;
            $this->periodEnd = $payroll->payroll_period_end;
            $this->paymentDate = $payroll->payment_date;
            $this->notes = $payroll->notes;
        } else {
            $this->isEditting = false;
        }
        $this->loading = false;
        $this->showMainModal = true;
    }

    public function save()
    {
        $this->validate([
            'periodStart' => 'required|date',
            'periodEnd' => 'required|date',
            'paymentDate' => 'required|date',
            'notes' => 'nullable|string|max:255',
        ]);
        $this->loading = true;
        if ($this->isEditting) {
            $payroll = ModelsPayroll::find($this->selectedPayrollId);
            $payroll->update([
                'payroll_period_start' => $this->periodStart,
                'payroll_period_end' => $this->periodEnd,
                'payment_date' => $this->paymentDate,
                'notes' => $this->notes,
            ]);
        } else {
            ModelsPayroll::create([
                'payroll_period_start' => $this->periodStart,
                'payroll_period_end' => $this->periodEnd,
                'payment_date' => $this->paymentDate,
                'notes' => $this->notes,
            ]);
        }
        $this->loading = false;
        Toaster::success('🎉 Payroll saved successfully!');
        $this->closeModal();
    }

    public function openDeleteModal($id)
    {
        $this->selectedPayrollId = $id;
        $this->showDeleteModal = true;
    }

    public function delete()
    {
        $payroll = ModelsPayroll::find($this->selectedPayrollId);
        if ($payroll) {
            $payroll->delete();
            Toaster::success('🗑️ Payroll deleted successfully!');
        } else {
            Toaster::error('Payroll not found!');
        }
        $this->closeModal();
    }

    public function openGenerateModal($id = null)
    {
        $payroll = ModelsPayroll::find($id);
        if (!$payroll) {
            Toaster::error('Payroll not found!');
            return;
        }
        $this->selectedPayrollId = $id;
        $this->periodStart = $payroll->payroll_period_start;
        $this->periodEnd = $payroll->payroll_period_end;
        $this->paymentDate = $payroll->payment_date;
        $this->showGenerateModal = true;
    }

    public function calculateTotalAmount()
    {
        $payrolls = ModelsPayroll::latest()->paginate(10);
        return $payrolls->sum('amount');
    }
}
