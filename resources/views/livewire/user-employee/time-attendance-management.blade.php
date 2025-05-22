<div>
    <x-page-heading :pageHeading="__('Time Attendance Management')"
        :pageDesc="__('Manage your time attendance here')" />

    <!-- resources/views/livewire/user-employee/time-attendance-management.blade.php -->
    <div class="flux-container">
        <!-- Header Section -->
        <div class="flux-flex flux-justify-between flux-items-center flux-mb-6">
            <h2 class="flux-text-2xl flux-font-bold">My Overtime Requests</h2>
            <x-flux-button wire:click="$toggle('showCreateModal')" class="flux-bg-blue-600 hover:flux-bg-blue-700">
                + New Request
            </x-flux-button>
        </div>

        <!-- Overtime Table -->
        <x-flux-table class="flux-min-w-full">
            <thead>
                <tr class="flux-bg-gray-50">
                    <x-flux-th>Date</x-flux-th>
                    <x-flux-th>Duration</x-flux-th>
                    <x-flux-th>Status</x-flux-th>
                    <x-flux-th>Reason</x-flux-th>
                    <x-flux-th>Actions</x-flux-th>
                </tr>
            </thead>
            <tbody>
                @forelse($overtimes as $overtime)
                <tr>
                    <x-flux-td>{{ $overtime->overtime_date->format('d M Y') }}</x-flux-td>
                    <x-flux-td>{{ $overtime->duration }} hours</x-flux-td>
                    <x-flux-td>
                        <span class="flux-badge flux-badge-{{ $overtime->status_color }}">
                            {{ ucfirst($overtime->status) }}
                        </span>
                    </x-flux-td>
                    <x-flux-td class="flux-max-w-xs flux-truncate">{{ $overtime->reason }}</x-flux-td>
                    <x-flux-td>
                        <x-flux-button wire:click="showOvertimeDetail({{ $overtime->id }})"
                            class="flux-bg-gray-100 hover:flux-bg-gray-200">
                            View
                        </x-flux-button>
                    </x-flux-td>
                </tr>
                @empty
                <tr>
                    <x-flux-td colspan="5" class="flux-text-center flux-py-4">
                        No overtime records found
                    </x-flux-td>
                </tr>
                @endforelse
            </tbody>
        </x-flux-table>

        <!-- Create Overtime Modal -->
        <x-flux-modal wire:model="showCreateModal">
            <div class="flux-p-6">
                <h3 class="flux-text-xl flux-mb-4">New Overtime Request</h3>

                <form wire:submit.prevent="createOvertime">
                    <div class="flux-grid flux-grid-cols-2 flux-gap-4 flux-mb-4">
                        <div>
                            <x-flux-label>Overtime Date</x-flux-label>
                            <x-flux-input type="date" wire:model="overtimeDate" min="{{ now()->format('Y-m-d') }}"
                                class="flux-w-full" required />
                        </div>

                        <div>
                            <x-flux-label>Time Range</x-flux-label>
                            <div class="flux-flex flux-gap-2">
                                <x-flux-input type="time" wire:model="startTime" class="flux-w-full" required />
                                <span class="flux-self-center">to</span>
                                <x-flux-input type="time" wire:model="endTime" class="flux-w-full" required />
                            </div>
                        </div>
                    </div>

                    <div class="flux-mb-4">
                        <x-flux-label>Reason</x-flux-label>
                        <x-flux-textarea wire:model="reason" rows="3" class="flux-w-full"
                            placeholder="Explain the reason for overtime..." required />
                    </div>

                    <div class="flux-flex flux-justify-end flux-gap-2">
                        <x-flux-button type="button" wire:click="$toggle('showCreateModal')" class="flux-bg-gray-100">
                            Cancel
                        </x-flux-button>
                        <x-flux-button type="submit" class="flux-bg-blue-600 hover:flux-bg-blue-700">
                            Submit Request
                        </x-flux-button>
                    </div>
                </form>
            </div>
        </x-flux-modal>

        <!-- Detail Modal -->
        <x-flux-modal wire:model="showingDetailModal">
            <div class="flux-p-6">
                <h3 class="flux-text-xl flux-mb-4">Request Details</h3>

                @if($selectedOvertime)
                <div class="flux-space-y-4">
                    <div class="flux-flex flux-justify-between">
                        <div>
                            <label class="flux-font-medium">Status:</label>
                            <p class="flux-badge flux-badge-{{ $selectedOvertime->status_color }}">
                                {{ ucfirst($selectedOvertime->status) }}
                            </p>
                        </div>
                        <div>
                            <label class="flux-font-medium">Submitted:</label>
                            <p>{{ $selectedOvertime->created_at->diffForHumans() }}</p>
                        </div>
                    </div>

                    <div>
                        <label class="flux-font-medium">Date:</label>
                        <p>{{ $selectedOvertime->overtime_date->format('d F Y') }}</p>
                    </div>

                    <div>
                        <label class="flux-font-medium">Time:</label>
                        <p>{{ date('H:i', strtotime($selectedOvertime->start_time)) }} -
                            {{ date('H:i', strtotime($selectedOvertime->end_time)) }}</p>
                    </div>

                    <div>
                        <label class="flux-font-medium">Reason:</label>
                        <p class="flux-whitespace-pre-wrap flux-bg-gray-50 flux-p-3 flux-rounded-lg">
                            {{ $selectedOvertime->reason }}
                        </p>
                    </div>

                    @if($selectedOvertime->status === 'rejected')
                    <div class="flux-bg-red-50 flux-p-3 flux-rounded-lg">
                        <label class="flux-font-medium flux-text-red-600">Manager's Note:</label>
                        <p class="flux-text-red-700">{{ $selectedOvertime->manager_note ?? 'No notes provided' }}</p>
                    </div>
                    @endif
                </div>
                @endif
            </div>
        </x-flux-modal>
    </div>
</div>
