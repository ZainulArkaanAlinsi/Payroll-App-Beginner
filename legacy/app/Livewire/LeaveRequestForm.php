<?php

namespace App\Livewire;

use App\Models\Employee;
use App\Models\LeaveRequest;
use Illuminate\Support\Facades\Auth;
use Livewire\Component;

class LeaveRequestForm extends Component
{
    public $employee_id;
    public $showModal = false;
    public $leave_type = 'sick';
    public $start_date;
    public $end_date;
    public $reason = '';

    protected function rules()
    {
        return [
            'employee_id'  => ['required', 'exists:employees,id'],
            'leave_type'   => ['required', 'in:sick,vacation,personal,other'],
            'start_date'   => ['required', 'date', 'before_or_equal:end_date'],
            'end_date'     => ['required', 'date', 'after_or_equal:start_date'],
            'reason'       => ['nullable', 'string'],
        ];
    }

    public function mount()
    {
        $this->employee_id = Auth::user()->employee_id;
        $this->start_date = now()->format('Y-m-d');
        $this->end_date = now()->addDay()->format('Y-m-d');
    }

    public function updated($propertyName)
    {
        $this->validateOnly($propertyName);
    }
    public function openModal()
    {
        $this->resetForm();
        $this->showModal = true;
    }

    public function closeModal()
    {
        $this->resetForm();
        $this->showModal = false;
    }

    public function resetForm()
    {
        $this->leave_type = 'sick';
        $this->start_date = now()->format('Y-m-d');
        $this->end_date = now()->addDay()->format('Y-m-d');
        $this->reason = '';
    }

    public function submit()
    {
        $this->validate();

        LeaveRequest::create([
            'employee_id'   => $this->employee_id,
            'leave_type'    => $this->leave_type,
            'start_date'    => $this->start_date,
            'end_date'      => $this->end_date,
            'reason'        => $this->reason,
            'status'        => 'pending',
        ]);

        $this->closeModal();
        session()->flash('message', 'Leave request submitted successfully!');
    }

    public function approveLeaveRequest($id)
    {
        $leaveRequest = LeaveRequest::where('employee_id', $this->employee_id)->find($id);
        if ($leaveRequest) {
            $leaveRequest->update(['status' => 'approved', 'approval_date' => now()]);
            session()->flash('message', 'Leave request approved.');
        }
    }

    public function declineLeaveRequest($id)
    {
        $leaveRequest = LeaveRequest::where('employee_id', $this->employee_id)->find($id);
        if ($leaveRequest) {
            $leaveRequest->update(['status' => 'declined']);
            session()->flash('message', 'Leave request declined.');
        }
    }

    public function deleteLeaveRequest($id)
    {
        $leaveRequest = LeaveRequest::where('employee_id', $this->employee_id)->find($id);
        if ($leaveRequest) {
            $leaveRequest->delete();
            session()->flash('message', 'Leave request deleted.');
        }
    }

    public function render()
    {
        $leaveRequests = LeaveRequest::where('employee_id', $this->employee_id)->latest()->get();

        return view('livewire.leave-request-form', [
            'employees' => Employee::all(),
            'leaveRequests' => $leaveRequests,
            'totalCount' => $leaveRequests->count(),
            'approvedCount' => $leaveRequests->where('status', 'approved')->count(),
            'pendingCount' => $leaveRequests->where('status', 'pending')->count(),
        ]);
    }
    public function getLeaveRequestCount()
    {
        return LeaveRequest::where('employee_id', $this->employee_id)->count();
    }
    public function getApprovedLeaveRequestsCount()
    {
        return LeaveRequest::where('employee_id', $this->employee_id)->where('status', 'approved')->count();
    }
    public function getPendingLeaveRequestsCount()
    {
        return LeaveRequest::where('employee_id', $this->employee_id)->where('status', 'pending')->count();
    }
}
