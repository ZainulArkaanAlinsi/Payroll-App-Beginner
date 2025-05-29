<div class="min-h-screen bg-gray-50/30 dark:bg-neutral-900 p-6">
    <div class="max-w-7xl mx-auto space-y-6">
        <!-- Header Section -->
        <div
            class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-700">
            <div>
                <h1 class="text-2xl font-bold text-gray-800 dark:text-neutral-100 flex items-center gap-3">
                    ⏰ Time & Attendance
                    <span
                        class="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full">
                        Live Tracking
                    </span>
                </h1>
                <p class="mt-2 text-gray-500 dark:text-neutral-400">
                    Monitor real-time attendance and manage overtime requests
                </p>
            </div>
            <div class="flex items-center gap-3">
                <flux:button icon="plus" variant="primary" wire:click="openOvertimeModal"
                    class="!px-5 !py-2.5 !rounded-xl shadow-sm hover:shadow-md transition-all">
                    New Overtime
                </flux:button>
            </div>
        </div>

        <!-- Month Filter -->
        <div class="p-5 bg-white dark:bg-neutral-800 rounded-xl border border-gray-100 dark:border-neutral-700">
            <div class="flex flex-wrap items-center gap-4">
                <div class="flex items-center gap-2 text-gray-600 dark:text-neutral-300">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span class="font-medium">Filter Timeline:</span>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button wire:click="clearMonthFilter"
                        class="px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                        {{ !$selectedYearMonthFilter ?
                            'bg-blue-600 text-white shadow-lg' :
                            'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                        All Time
                    </button>
                    @foreach ($monthLinks ?? [] as $link)
                    <button wire:click="applyMonthFilter('{{ $link['value'] }}')"
                        class="px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2
                        {{ $selectedYearMonthFilter == $link['value'] ?
                            'bg-blue-600 text-white shadow-lg' :
                            'bg-gray-100 dark:bg-neutral-700 text-gray-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-600' }}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {{ $link['display'] }}
                    </button>
                    @endforeach
                </div>
            </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Attendance Card -->
            <div
                class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
                <div class="p-6 border-b border-gray-100 dark:border-neutral-700">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-neutral-100 flex items-center gap-2">
                            <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Today's Attendance
                        </h2>
                        <span
                            class="text-xs bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">
                            {{ $attendances->count() }} Active
                        </span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-neutral-700/30">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Employee</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Check-in</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Check-out</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-neutral-700">
                            @forelse ($attendances as $attendance)
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-neutral-700/20 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                            <span class="text-sm font-medium text-blue-600 dark:text-blue-400">{{
                                                collect(explode(' ', $attendance->employee->full_name))->map(fn($part)
                                                => strtoupper(Str::substr($part, 0, 1)))->implode('')
                                                }}</span>
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900 dark:text-neutral-100">{{
                                                $attendance->employee->full_name }}</div>
                                            <div class="text-xs text-gray-500 dark:text-neutral-400">{{
                                                $attendance->employee->position }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900 dark:text-neutral-200">
                                    @if($attendance->check_in)
                                    <div class="flex items-center gap-2">
                                        <span class="text-green-500">●</span>
                                        {{ $attendance->check_in->format('H:i') }}
                                    </div>
                                    @else - @endif
                                </td>
                                <td class="px-6 py-4 text-sm text-gray-900 dark:text-neutral-200">
                                    @if($attendance->check_out)
                                    <div class="flex items-center gap-2">
                                        <span class="text-red-500">●</span>
                                        {{ $attendance->check_out->format('H:i') }}
                                    </div>
                                    @else - @endif
                                </td>
                                <td class="px-6 py-4">
                                    @if($attendance->check_in && $attendance->check_out)
                                    <span
                                        class="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs">Completed</span>
                                    @elseif($attendance->check_in)
                                    <span
                                        class="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-xs">In
                                        Progress</span>
                                    @else
                                    <span
                                        class="px-2 py-1 rounded-full bg-gray-100 dark:bg-neutral-700 text-gray-600 dark:text-neutral-300 text-xs">Pending</span>
                                    @endif
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="4" class="px-6 py-8 text-center">
                                    <div class="text-gray-400 dark:text-neutral-500 flex flex-col items-center gap-2">
                                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span class="text-sm">No attendance records found</span>
                                    </div>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Overtime Card -->
            <div
                class="bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-gray-100 dark:border-neutral-700">
                <div class="p-6 border-b border-gray-100 dark:border-neutral-700">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-neutral-100 flex items-center gap-2">
                            <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Overtime Requests
                        </h2>
                        <span
                            class="text-xs bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full">
                            {{ $overtimes->count() }} Entries
                        </span>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-neutral-700/30">
                            <tr>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Employee</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Duration</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Time Range</th>
                                <th
                                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                                    Actions</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-neutral-700">
                            @forelse ($overtimes as $overtime)
                            <tr class="hover:bg-gray-50/50 dark:hover:bg-neutral-700/20 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div
                                            class="flex-shrink-0 h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                                            <span class="text-sm font-medium text-purple-600 dark:text-purple-400">
                                                {{
                                                collect(explode(' ', $overtime->employee->full_name))
                                                ->map(fn($part) => strtoupper(Str::substr($part, 0, 1)))
                                                ->implode('')
                                                }}
                                            </span>
                                        </div>
                                        <div>
                                            <div class="text-sm font-medium text-gray-900 dark:text-neutral-100">{{
                                                $overtime->employee->full_name }}</div>
                                            <div class="text-xs text-gray-500 dark:text-neutral-400">{{
                                                $overtime->employee->department }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-medium text-amber-600 dark:text-amber-400">{{
                                            $overtime->duration }}m</span>
                                        <span class="text-xs text-gray-400">({{ $overtime->duration/60 }}h)</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex flex-col gap-1">
                                        <span class="text-xs text-gray-500 dark:text-neutral-400">{{
                                            $overtime->overtime_date->format('d M Y') }}</span>
                                        <span
                                            class="text-sm text-gray-900 dark:text-neutral-100 flex items-center gap-2">
                                            <span class="text-blue-500">→</span>
                                            {{ $overtime->start_time->format('H:i') }} - {{
                                            $overtime->end_time->format('H:i') }}
                                        </span>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-2">
                                        <flux:button icon="pencil" variant="primary"
                                            wire:click="openOvertimeModal({{ $overtime->id }})"
                                            class="!p-2 !rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20" />
                                        <flux:button icon="trash" variant="danger"
                                            wire:click="openDeleteOvertimeModal({{ $overtime->id }})"
                                            class="!p-2 !rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20" />
                                    </div>
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="4" class="px-6 py-8 text-center">
                                    <div class="text-gray-400 dark:text-neutral-500 flex flex-col items-center gap-2">
                                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span class="text-sm">No overtime requests found</span>
                                    </div>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>


    {{-- Overtime Modal --}}
    <flux:modal wire:close="closeModal" name="overtime-modal"
        class="md:w-96 transition-all duration-300 animate-fade-in">
        <form wire:submit="save" class="space-y-6">
            <div>
                <flux:heading size="lg">
                    @if ($isEditting)
                    Edit
                    @else
                    New
                    @endif Overtime
                </flux:heading>
                <flux:text class="mt-2">
                    @if ($isEditting)
                    Update overtime to the system. This will allow you to manage your overtime more effectively.
                    @else
                    Add a new overtime to the system. This will allow you to manage your overtime more effectively.
                    @endif
                </flux:text>
            </div>
            <flux:select label="Employee" wire:model="selectedEmployeeId" placeholder="Choose employee..." required>
                @foreach ($employees as $employee)
                <flux:select.option value="{{ $employee->id }}">{{ $employee->full_name }}</flux:select.option>
                @endforeach
            </flux:select>
            <div class="flex gap-2">
                <flux:input wire:model="overtimeDate" label="Overtime Date" type="date" required class="flex-1" />
                <flux:input wire:model="startTime" label="Start Time" type="time" required class="flex-1" />
                <flux:input wire:model="endTime" label="End Time" type="time" required class="flex-1" />
            </div>
            <flux:textarea wire:model="reason" label="Reason" placeholder="Reason" required />
            <div class="flex">
                <flux:spacer />
                <flux:button type="submit" variant="primary">Save</flux:button>
            </div>
        </form>
    </flux:modal>

    {{-- Modal Delete --}}
    <flux:modal name="delete-modal" class="min-w-[22rem] transition-all duration-300 animate-fade-in"
        wire:close="closeModal">
        <form wire:submit="deleteOvertime" class="space-y-6">
            <div>
                <flux:heading size="lg">Delete?</flux:heading>
                <flux:text class="mt-2">
                    <p>You're about to delete this overtime.</p>
                    <p class="text-red-500">This action cannot be reversed.</p>
                </flux:text>
            </div>
            <div class="flex gap-2">
                <flux:spacer />
                <flux:modal.close>
                    <flux:button variant="ghost">Cancel</flux:button>
                </flux:modal.close>
                <flux:button type="submit" variant="danger">Delete</flux:button>
            </div>
        </form>
    </flux:modal>


    <style>
        @keyframes fade-in {
            from {
                opacity: 0;
                transform: translateY(20px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .animate-fade-in {
            animation: fade-in 0.5s ease;
        }
    </style>
</div>
</div>