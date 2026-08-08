<div class="space-y-8 mx-auto max-w-6xl px-6 py-12">
    <!-- Header Section -->
    <div class="mb-10 border-b border-slate-200 dark:border-slate-700/60 pb-6">
        <h1 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Leave Requests</h1>
        <p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Manage and track your leave applications.</p>
    </div>

    <div class="space-y-10">
        <!-- Pending Requests Section -->
        <section>
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <svg class="w-6 h-6 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Pending Requests
                    <span class="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-amber-900/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800">{{ count($pendingLeaveRequests) }}</span>
                </h2>
            </div>
            
            @if(count($pendingLeaveRequests) > 0)
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                @foreach ($pendingLeaveRequests as $pendingLR)
                <div class="group bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 border border-slate-200/60 dark:border-slate-700/60 flex flex-col relative overflow-hidden transform hover:-translate-y-1">
                    <!-- Top accent line -->
                    <div class="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div class="flex justify-between items-start mb-5 mt-1">
                        <div class="flex items-center gap-3.5">
                            <div class="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white dark:ring-slate-800">
                                {{ substr($pendingLR->employee->full_name, 0, 1) }}
                            </div>
                            <div>
                                <h3 class="font-bold text-slate-800 dark:text-slate-100 leading-tight">{{ $pendingLR->employee->full_name }}</h3>
                                <p class="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{{ $pendingLR->leave_type }}</p>
                            </div>
                        </div>
                        <span class="bg-slate-100 text-slate-600 dark:bg-slate-700/80 dark:text-slate-300 text-xs px-2.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 shadow-sm border border-slate-200 dark:border-slate-600/50">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            {{ (new DateTime($pendingLR->end_date))->diff(new DateTime($pendingLR->start_date))->format('%d') }} Day(s)
                        </span>
                    </div>
                    
                    <div class="mb-5 flex-grow bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 relative">
                        <svg class="w-6 h-6 text-slate-200 dark:text-slate-700 absolute top-2 right-2" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"></path></svg>
                        <p class="text-sm text-slate-600 dark:text-slate-300 italic relative z-10">{{ $pendingLR->reason }}</p>
                    </div>
                    
                    <div class="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50">
                        <div class="flex flex-col">
                            <span class="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Start Date</span>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ date('M d, Y', strtotime($pendingLR->start_date)) }}</span>
                        </div>
                        <div class="flex gap-2">
                            <flux:button size="sm" variant="danger" wire:click="rejectLeaveRequest({{ $pendingLR->id }})" class="rounded-xl px-3 shadow-sm hover:shadow-md transition-all duration-200">
                                <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                Cancel
                            </flux:button>
                        </div>
                    </div>
                </div>
                @endforeach
            </div>
            @else
            <div class="flex flex-col items-center justify-center py-16 px-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/30 dark:to-slate-800/10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 shadow-sm">
                <div class="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center mb-5 shadow-inner">
                    <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">All caught up!</h3>
                <p class="text-slate-500 dark:text-slate-400 text-center max-w-sm">There are no pending leave requests at the moment.</p>
            </div>
            @endif
        </section>

        <!-- Processed Requests Section -->
        <section>
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    Processed Requests
                </h2>
            </div>
            
            <div class="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-slate-200 dark:divide-slate-700/50">
                        <thead class="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm">
                            <tr>
                                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Employee</th>
                                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Leave Details</th>
                                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                                <th scope="col" class="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-1/3">Reason</th>
                                <th scope="col" class="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-700/50 bg-transparent">
                            @forelse ($processedLeaveRequests as $processedLR)
                            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors duration-200 group">
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex items-center gap-3">
                                        <div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-sm shadow-sm">
                                            {{ substr($processedLR->employee->full_name, 0, 1) }}
                                        </div>
                                        <div class="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{{ $processedLR->employee->full_name }}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <div class="flex flex-col">
                                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ $processedLR->leave_type }}</span>
                                        <span class="text-xs text-slate-500 mt-0.5">{{ date('M d, Y', strtotime($processedLR->start_date)) }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap">
                                    <span class="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {{ (new DateTime($processedLR->end_date))->diff(new DateTime($processedLR->start_date))->format('%d') }} Day(s)
                                    </span>
                                </td>
                                <td class="px-6 py-4">
                                    <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2" title="{{ $processedLR->reason }}">
                                        {{ $processedLR->reason }}
                                    </p>
                                </td>
                                <td class="px-6 py-4 whitespace-nowrap text-right">
                                    @if($processedLR->status == 'approved')
                                        <span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                                            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                            Approved
                                        </span>
                                    @else
                                        <span class="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold bg-rose-100/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 shadow-sm">
                                            <div class="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                            Denied
                                        </span>
                                    @endif
                                </td>
                            </tr>
                            @empty
                            <tr>
                                <td colspan="5" class="px-6 py-12 text-center">
                                    <div class="flex flex-col items-center justify-center">
                                        <svg class="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        <p class="text-slate-500 dark:text-slate-400 font-medium text-sm">No processed leave requests found.</p>
                                    </div>
                                </td>
                            </tr>
                            @endforelse
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    </div>
</div>
