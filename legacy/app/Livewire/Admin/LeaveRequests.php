<?php

namespace App\Livewire\Admin;

use App\Models\LeaveRequest;
use Livewire\Component;

class LeaveRequests extends Component
{

    public $pendingLeaveRequests = [];
    public $processedLeaveRequests = [];

    public function mount()
    {
        $this->pendingLeaveRequests = LeaveRequest::where('status', 'pending')->get();
        $this->processedLeaveRequests = LeaveRequest::where('status', '!=', 'pending')->get();
    }

    public function approveLeaveRequest($leaveId)
    {
        $leave = LeaveRequest::find($leaveId);
        if ($leave) {
            $leave->status = 'approved';
            $leave->save();
            $this->mount(); // Refresh the data
        }
    }
    public function rejectLeaveRequest($leaveId)
    {
        $leave = LeaveRequest::find($leaveId);
        if ($leave) {
            $leave->status = 'declined';
            $leave->save();
            $this->mount(); // Refresh the data
        }
    }

    public function render()
    {
        return view('livewire.admin.leave-requests');
    }
}
