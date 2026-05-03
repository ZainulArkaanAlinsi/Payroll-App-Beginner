<div>
    <x-page-heading :pageHeading="__('Time Attendance Management')"
        :pageDesc="__('Manage your time attendance here')" />

    <div class="px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 animate-[fadeIn_0.5s_ease-out]">
            <div>
                <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                    <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    My Overtime Requests
                </h2>
                <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    Review and submit your overtime records
                </p>
            </div>
            <flux:button wire:click="$toggle('showCreateModal')"
                class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all duration-300 rounded-xl px-5 border-none">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd"
                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                        clip-rule="evenodd" />
                </svg>
                New Request
            </flux:button>
        </div>

        <!-- Overtime Table -->
        <div class="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
                    <thead class="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                        <tr>
                            <th class="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                            <th class="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                            <th class="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            <th class="px-6 py-5 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                            <th class="px-6 py-5 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50 bg-transparent">
                        @forelse($overtimes as $overtime)
                        <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors duration-200 group">
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center gap-2 text-sm font-medium text-slate-900 dark:text-slate-200">
                                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    {{ $overtime->overtime_date->format('d M Y') }}
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50 shadow-sm">
                                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {{ $overtime->duration }} hours
                                </div>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap">
                                @if(strtolower($overtime->status) === 'approved')
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                        {{ ucfirst($overtime->status) }}
                                    </span>
                                @elseif(strtolower($overtime->status) === 'pending')
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {{ ucfirst($overtime->status) }}
                                    </span>
                                @else
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        {{ ucfirst($overtime->status) }}
                                    </span>
                                @endif
                            </td>
                            <td class="px-6 py-4">
                                <p class="text-sm text-slate-600 dark:text-slate-400 max-w-[250px] truncate" title="{{ $overtime->reason }}">
                                    {{ $overtime->reason }}
                                </p>
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <flux:button wire:click="showOvertimeDetail({{ $overtime->id }})"
                                    class="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 rounded-xl px-4 py-1.5 shadow-sm transition-all duration-200 border-none">
                                    View Details
                                </flux:button>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="5" class="px-6 py-16 text-center">
                                <div class="flex flex-col items-center justify-center">
                                    <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-5 ring-1 ring-slate-200 dark:ring-slate-700">
                                        <svg class="w-10 h-10 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">No overtime records</h3>
                                    <p class="text-sm text-slate-500 dark:text-slate-400">You haven't submitted any overtime requests yet.</p>
                                </div>
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Create Overtime Modal -->
        <flux:modal wire:model="showCreateModal" max-width="2xl" class="backdrop-blur-sm">
            <div class="p-8 bg-white dark:bg-slate-900 rounded-3xl">
                <div class="flex justify-between items-center mb-8 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                        </div>
                        New Overtime Request
                    </h3>
                    <flux:button type="button" wire:click="$set('showCreateModal', false)" variant="ghost" size="sm"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full" icon="x-mark">
                    </flux:button>
                </div>

                <form wire:submit.prevent="createOvertime" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <flux:label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Overtime Date</flux:label>
                            <flux:input type="date" wire:model="overtimeDate" min="{{ now()->format('Y-m-d') }}"
                                class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 shadow-sm" required />
                        </div>

                        <div>
                            <flux:label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Time Range</flux:label>
                            <div class="flex items-center gap-3">
                                <flux:input type="time" wire:model="startTime"
                                    class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 shadow-sm" required />
                                <span class="text-slate-400 font-medium text-sm">to</span>
                                <flux:input type="time" wire:model="endTime"
                                    class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 shadow-sm" required />
                            </div>
                        </div>
                    </div>

                    <div>
                        <flux:label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Reason</flux:label>
                        <flux:textarea wire:model="reason" rows="3"
                            class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-800 shadow-sm resize-none"
                            placeholder="Explain the reason for your overtime request..." required />
                    </div>

                    <div class="flex justify-end gap-3 pt-8 border-t border-slate-100 dark:border-slate-800">
                        <flux:button type="button" wire:click="$toggle('showCreateModal')"
                            class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl px-6 border-none">
                            Cancel
                        </flux:button>
                        <flux:button type="submit" class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl px-6 shadow-md shadow-indigo-500/20 border-none">
                            Submit Request
                        </flux:button>
                    </div>
                </form>
            </div>
        </flux:modal>

        <!-- Detail Modal -->
        <flux:modal wire:model="showingDetailModal" max-width="lg" class="backdrop-blur-sm">
            <div class="p-8 bg-white dark:bg-slate-900 rounded-3xl">
                <div class="flex justify-between items-center mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 class="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        Request Details
                    </h3>
                    <flux:button type="button" wire:click="$set('showingDetailModal', false)" variant="ghost" size="sm"
                        class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full" icon="x-mark">
                    </flux:button>
                </div>

                @if($selectedOvertime)
                <div class="space-y-5 text-sm">
                    <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl">
                        <div>
                            <span class="block text-slate-500 dark:text-slate-400 font-medium mb-1">Status</span>
                            @if(strtolower($selectedOvertime->status) === 'approved')
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    {{ ucfirst($selectedOvertime->status) }}
                                </span>
                            @elseif(strtolower($selectedOvertime->status) === 'pending')
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    {{ ucfirst($selectedOvertime->status) }}
                                </span>
                            @else
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    {{ ucfirst($selectedOvertime->status) }}
                                </span>
                            @endif
                        </div>
                        <div class="text-right">
                            <span class="block text-slate-500 dark:text-slate-400 font-medium mb-1">Submitted</span>
                            <span class="font-bold text-slate-900 dark:text-white">{{ $selectedOvertime->created_at->diffForHumans() }}</span>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                            <span class="block text-indigo-500 dark:text-indigo-400 font-medium mb-1">Date</span>
                            <span class="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                <svg class="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                {{ $selectedOvertime->overtime_date->format('d M Y') }}
                            </span>
                        </div>
                        <div class="bg-purple-50/50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
                            <span class="block text-purple-500 dark:text-purple-400 font-medium mb-1">Time Range</span>
                            <span class="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                                <svg class="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {{ date('H:i', strtotime($selectedOvertime->start_time)) }} -
                                {{ date('H:i', strtotime($selectedOvertime->end_time)) }}
                            </span>
                        </div>
                    </div>

                    <div class="pt-2">
                        <p class="text-slate-500 dark:text-slate-400 font-medium mb-2">Reason:</p>
                        <p class="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 leading-relaxed italic">
                            "{{ $selectedOvertime->reason }}"
                        </p>
                    </div>

                    @if($selectedOvertime->status === 'rejected')
                    <div class="mt-4 bg-rose-50/80 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                        <p class="text-rose-600 dark:text-rose-400 font-bold mb-2 flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            Manager's Note:
                        </p>
                        <p class="text-rose-700 dark:text-rose-300 leading-relaxed">{{ $selectedOvertime->manager_note ?? 'No specific notes provided.' }}</p>
                    </div>
                    @endif
                </div>
                @endif
            </div>
        </flux:modal>
    </div>

    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</div>
