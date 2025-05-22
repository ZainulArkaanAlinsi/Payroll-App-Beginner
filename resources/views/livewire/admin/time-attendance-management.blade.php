<div>
    <x-page-heading :pageHeading="__('Time Attendance Management')"
        :pageDesc="__('Manage your time attendance here')" />

    <div class="px-4 sm:px-6 lg:px-8 py-6">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-900">Overtime Management</h2>
                <p class="mt-1 text-sm text-gray-500">Total {{ $overtimes->count() }} records found</p>
            </div>
            <flux:button wire:click="$toggle('showCreateModal')"
                class="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clip-rule="evenodd" />
                </svg>
                Create Overtime
            </flux:button>
        </div>

        <!-- Overtime Table -->
        <div class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Employee</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Duration</th>
                            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Reason</th>
                            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        @forelse($overtimes as $overtime)
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {{ \Carbon\Carbon::parse($overtime->overtime_date)->format('d M Y') }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                {{ $overtime->employee->full_name }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                <div
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {{ $overtime->duration }} hours
                                </div>
                            </td>
                            <td class="px-4 py-4 text-sm text-gray-600 max-w-[300px] truncate">
                                {{ $overtime->reason }}
                            </td>
                            <td class="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <flux:button wire:click="showOvertimeDetail({{ $overtime->id }})"
                                    class="text-indigo-600 hover:text-indigo-900 bg-transparent shadow-none">
                                    View Details
                                </flux:button>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                                <div class="flex flex-col items-center justify-center gap-2">
                                    <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor"
                                        viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p class="text-sm">No overtime records found</p>
                                </div>
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Create Overtime Modal -->
        <flux:modal wire:model="showCreateModal" max-width="2xl">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6 pb-2 border-b border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-900">New Overtime Request</h3>
                    <flux:button type="button" wire:click="$set('showCreateModal', false)" variant="ghost" size="sm"
                        class="text-gray-400 hover:text-gray-500" icon="x-mark">
                        Close
                    </flux:button>
                </div>

                <form wire:submit.prevent="createOvertime" class="space-y-6">
                    @if($isAdmin)
                    <div>
                        <flux:label class="block text-sm font-medium text-gray-700 mb-2">Employee</flux:label>
                        <flux:select wire:model="employeeId"
                            class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="">Select Employee</option>
                            @foreach(\App\Models\Employee::all() as $emp)
                            <option value="{{ $emp->id }}">{{ $emp->full_name }}</option>
                            @endforeach
                        </flux:select>
                    </div>
                    @endif

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <flux:label class="block text-sm font-medium text-gray-700 mb-2">Date</flux:label>
                            <flux:input type="date" wire:model="overtimeDate"
                                class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                        </div>

                        <div>
                            <flux:label class="block text-sm font-medium text-gray-700 mb-2">Time Range</flux:label>
                            <div class="flex items-center gap-2">
                                <flux:input type="time" wire:model="startTime"
                                    class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                                <span class="text-gray-400">to</span>
                                <flux:input type="time" wire:model="endTime"
                                    class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <flux:label class="block text-sm font-medium text-gray-700 mb-2">Reason</flux:label>
                        <flux:textarea wire:model="reason" rows="3"
                            class="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            placeholder="Enter reason for overtime..." />
                    </div>

                    <div class="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <flux:button type="button" wire:click="$set('showCreateModal', false)"
                            class="bg-gray-100 hover:bg-gray-200 text-gray-700">
                            Cancel
                        </flux:button>
                        <flux:button type="submit" class="bg-indigo-600 hover:bg-indigo-700 text-white">
                            Submit Request
                        </flux:button>
                    </div>
                </form>
            </div>
        </flux:modal>

        <!-- Detail Modal -->
        <flux:modal wire:model="showingDetailModal" max-width="lg">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4 pb-2 border-b border-gray-200">
                    <h3 class="text-xl font-semibold text-gray-900">Overtime Details</h3>
                    <flux:button type="button" wire:click="$set('showingDetailModal', false)" variant="ghost" size="sm"
                        class="text-gray-400 hover:text-gray-500">
                        Close
                    </flux:button>
                </div>

                @if($selectedOvertime)
                <div class="space-y-4 text-sm">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-500">Employee Name:</span>
                        <span class="font-medium text-gray-900">{{ $selectedOvertime->employee->full_name }}</span>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-500">Date:</span>
                        <span class="font-medium text-gray-900">{{ $selectedOvertime->overtime_date->format('d F Y')
                            }}</span>
                    </div>

                    <div class="flex justify-between items-center">
                        <span class="text-gray-500">Time Range:</span>
                        <span class="font-medium text-gray-900">
                            {{ date('H:i', strtotime($selectedOvertime->start_time)) }} -
                            {{ date('H:i', strtotime($selectedOvertime->end_time)) }}
                        </span>
                    </div>

                    <div class="mt-4 pt-4 border-t border-gray-100">
                        <p class="text-gray-500 mb-2">Reason:</p>
                        <p class="text-gray-700 bg-gray-50 p-3 rounded-lg">{{ $selectedOvertime->reason }}</p>
                    </div>
                </div>
                @endif
            </div>
        </flux:modal>
    </div>
</div>