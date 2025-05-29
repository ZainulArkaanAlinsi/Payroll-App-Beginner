<div class="min-h-screen bg-black-200 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header Section -->
        <div class="mb-8">
            <flux:heading size="xl" class="text-3xl font-bold text-white-900">
                📋 Leave Request Management
            </flux:heading>
            <flux:text class="mt-2 text-white-600">
                Manage employee leave requests efficiently
            </flux:text>
        </div>

        <!-- Action Bar -->
        <div class="mb-6 flex justify-between items-center">
            <flux:button variant="primary" icon="plus" wire:click="openModal"
                class="hover:scale-[1.02] transition-transform">
                New Request
            </flux:button>
            <div class="flex gap-4">
                <flux:badge color="blue" icon="inbox">
                    Total: {{ $totalCount }}
                </flux:badge>
                <flux:badge color="green" icon="check-circle">
                    Approved: {{ $approvedCount }}
                </flux:badge>
                <flux:badge color="yellow" icon="clock">
                    Pending: {{ $pendingCount }}
                </flux:badge>
            </div>
        </div>

        <!-- Request List -->
        <div class="grid grid-cols-1 gap-4">
            @foreach($leaveRequests as $request)
            <div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="font-medium text-gray-900">
                            {{ $request->employee->full_name }}
                            <flux:badge
                                color="{{ method_exists($this, 'getStatusColor') ? $this->getStatusColor($request->status) : 'gray' }}"
                                size="sm">
                                {{ ucfirst($request->status) }}
                            </flux:badge>
                        </div>
                        <div class="text-sm text-gray-500 mt-1">
                            {{ \Carbon\Carbon::parse($request->start_date)->format('M d') }} - {{
                            \Carbon\Carbon::parse($request->end_date)->format('M d') }}
                            ({{
                            \Carbon\Carbon::parse($request->start_date)->diffInDays(\Carbon\Carbon::parse($request->end_date))
                            + 1 }} days)
                        </div>
                        <p class="text-gray-600 mt-2 text-sm">
                            {{ $request->reason }}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        @if($request->status === 'pending')
                        <flux:button variant="icon" icon="check" color="green"
                            wire:click="approveLeaveRequest({{ $request->id }})">
                        </flux:button>
                        <flux:button variant="icon" icon="x" color="red"
                            wire:click="declineLeaveRequest({{ $request->id }})">
                        </flux:button>
                        @endif
                    </div>
                </div>
            </div>
            @endforeach
        </div>
        <!-- Create/Edit Modal -->
        <flux:modal title="New Leave Request" :show="$showModal" wire:close="closeModal" max-width="2xl">
            <form wire:submit.prevent="submit" class="space-y-6">
                <!-- Employee Select -->
                <flux:select wire:model="employee_id" label="Employee" placeholder="Select employee" icon="user"
                    :options="$employees->map(fn($e) => ['value' => $e->id, 'label' => $e->full_name])">
                </flux:select>
                @error('employee_id')
                <span class="text-red-500 text-sm">{{ $message }}</span>
                @enderror

                <!-- Leave Type -->
                <div class="grid grid-cols-2 gap-4">
                    <flux:select wire:model="leave_type" label="Leave Type" placeholder="Select leave type" icon="list">
                        <flux:select.option value="sick" label="Sakit" icon="heart-pulse" />
                        <flux:select.option value="vacation" label="Cuti" icon="palm-tree" />
                        <flux:select.option value="personal" label="Izin" icon="notebook-pen" />
                        <flux:select.option value="other" label="Dinas" icon="briefcase" />
                    </flux:select>
                </div>
                @error('leave_type')
                <span class="text-red-500 text-sm">{{ $message }}</span>
                @enderror

                <!-- Date Range -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <flux:input type="date" wire:model="start_date" label="Start Date" icon="calendar-days">
                    </flux:input>
                    <flux:input type="date" wire:model="end_date" label="End Date" icon="calendar-days">
                    </flux:input>
                </div>
                @error('start_date')
                <span class="text-red-500 text-sm">{{ $message }}</span>
                @enderror
                @error('end_date')
                <span class="text-red-500 text-sm">{{ $message }}</span>
                @enderror

                <!-- Reason -->
                <flux:textarea wire:model="reason" label="Reason" placeholder="Leave reason..." rows="3"
                    icon="message-circle">
                </flux:textarea>
                @error('reason')
                <span class="text-red-500 text-sm">{{ $message }}</span>
                @enderror

                <!-- Footer -->
                <div class="mt-6 flex justify-end gap-3">
                    <flux:button variant="primary" wire:click="closeModal" type="button">
                        Cancel
                    </flux:button>
                    <flux:button variant="primary" type="submit" wire:loading.attr="disabled"
                        wire:loading.class="opacity-75" wire:target="submit">
                        <span wire:loading.remove wire:target="submit">Submit Request</span>
                        <span wire:loading wire:target="submit">Submitting...</span>
                    </flux:button>
                </div>
            </form>
        </flux:modal>

        <!-- Custom Success Alert -->
        @if(session()->has('message'))
        <div class="fixed bottom-4 right-4" x-data="{ show: true }" x-show="show"
            x-transition:enter="transition ease-out duration-300" x-transition:enter-start="opacity-0 translate-y-4"
            x-transition:enter-end="opacity-100 translate-y-0" x-transition:leave="transition ease-in duration-200"
            x-transition:leave-end="opacity-0 translate-y-4">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg flex items-center gap-3">
                <span class="icon-check w-5 h-5 text-green-700"></span>
                <span class="text-sm text-green-700">{{ session('message') }}</span>
                <flux:button wire:click="show = false" class="text-green-600 hover:text-green-800" type="button">
                    <span class="sr-only">Close</span>
                </flux:button>
            </div>
        </div>
        @endif
    </div>
</div>
@push('styles')
<style>
    .animate-slide-in {
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }

        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
@endpush