<?php

namespace App\Livewire;

use App\Models\LeaveRequest;
use Livewire\Attributes\Layout;
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

    #[Layout('components.layouts.app.header')]
    public function render()
    {
        return view('livewire.leave-requests');
    }
}
