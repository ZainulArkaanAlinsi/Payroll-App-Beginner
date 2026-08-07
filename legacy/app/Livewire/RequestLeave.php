<?php

namespace App\Livewire;

use App\Models\LeaveRequest;
use Illuminate\Support\Facades\Auth;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;
use Masmerise\Toaster\Toaster;

class RequestLeave extends Component
{
    use WithPagination;
    public $isEditting = false;
    public $leaveRequestId = '';
    public $leaveType = '';
    public $startDate = '';
    public $endDate = '';
    public $reason = '';
    public $leaveRequestData = null;
    #[Title('Request Leave')]
    public function render()
    {
        return view('livewire.request-leave', [
            'leaveRequests' => Auth::user()->employee->leaveRequests()->latest()->paginate(10),
        ]);
    }
    public function openModal($id = null)
    {
        if ($id) {
            $this->isEditting = true;
            $leaveRequest = LeaveRequest::find($id);
            $this->leaveRequestId = $leaveRequest->id;
            $this->leaveType = $leaveRequest->leave_type;
            $this->startDate = $leaveRequest->start_date;
            $this->endDate = $leaveRequest->end_date;
            $this->reason = $leaveRequest->reason;
        }
        $this->modal('main-modal')->show();
    }
    public function closeModal()
    {
        $this->reset();
    }
    public function save()
    {
        $this->validate([
            'leaveType' => 'required|string|in:sick,vacation,personal,other',
            'startDate' => 'required|date',
            'endDate' => 'required|date|after_or_equal:startDate',
            'reason' => 'nullable|string|max:255',
        ]);

        if ($this->isEditting) {
            $leaveRequest = LeaveRequest::find($this->leaveRequestId);
            if ($leaveRequest->status !== 'pending') {
                Toaster::error('You can only edit leave requests on pending.');
                return;
            }
            $leaveRequest->update([
                'leave_type' => $this->leaveType,
                'start_date' => $this->startDate,
                'end_date' => $this->endDate,
                'reason' => $this->reason,
            ]);
        } else {
            LeaveRequest::create([
                'employee_id' => Auth::user()->employee->id,
                'leave_type' => $this->leaveType,
                'start_date' => $this->startDate,
                'end_date' => $this->endDate,
                'reason' => $this->reason,
            ]);
        }

        Toaster::success('Leave request saved successfully!');
        $this->modal('main-modal')->close();
        $this->closeModal();
        $this->resetPage();
    }
    public function openDeleteModal($id)
    {
        $this->leaveRequestId = $id;
        $this->modal('delete-modal')->show();
    }
    public function deleteLeaveRequest()
    {
        $leaveRequest = LeaveRequest::find($this->leaveRequestId);
        if ($leaveRequest->status !== 'pending') {
            Toaster::error('You can only delete leave requests on pending.');
            $this->modal('delete-modal')->close();
            $this->closeModal();
            return;
        }
        $leaveRequest->delete();
        Toaster::success('Leave request deleted successfully!');
        $this->modal('delete-modal')->close();
        $this->closeModal();
        $this->resetPage();
    }
    public function openViewModal($id)
    {
        $data = LeaveRequest::find($id);
        if (!$data) {
            Toaster::error('Leave request not found.');
            return;
        }
        $this->leaveRequestData = $data;
        $this->modal('view-modal')->show();
    }
}
