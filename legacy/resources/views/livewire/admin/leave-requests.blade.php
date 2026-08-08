<div class="flex flex-col gap-10 p-6 lg:p-12 animate-[fadeIn_0.6s_ease-out]">
    <!-- Talent Fluidity Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Human Capacity Management
            </div>
            <h1 class="text-5xl font-black tracking-tighter text-white leading-tight">
                Talent <span class="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-600">Fluidity</span>
            </h1>
            <p class="text-zinc-500 font-medium text-lg max-w-2xl italic leading-relaxed">Orchestrating time-off requests with high-precision approval protocols and capacity balancing.</p>
        </div>
        
        <div class="flex items-center gap-4">
            <div class="flex -space-x-3">
                @foreach($pendingLeaveRequests->take(3) as $req)
                    <div class="w-12 h-12 rounded-2xl border-4 border-zinc-950 bg-zinc-900 flex items-center justify-center text-xs font-black text-white ring-1 ring-white/10 overflow-hidden shadow-2xl">
                        {{ substr($req->employee->full_name, 0, 1) }}
                    </div>
                @endforeach
                @if(count($pendingLeaveRequests) > 3)
                    <div class="w-12 h-12 rounded-2xl border-4 border-zinc-950 bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-400 ring-1 ring-white/10 shadow-2xl">
                        +{{ count($pendingLeaveRequests) - 3 }}
                    </div>
                @endif
            </div>
        </div>
    </div>

    <!-- Fluidity Pulse: Quick Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        @php 
            $metrics = [
                ['label' => 'Total Requests', 'value' => count($pendingLeaveRequests), 'trend' => 'Pending', 'icon' => 'inbox', 'color' => 'amber'],
                ['label' => 'Approved Today', 'value' => '8', 'trend' => '+2', 'icon' => 'check-circle', 'color' => 'emerald'],
                ['label' => 'Rejected Today', 'value' => '2', 'trend' => '-1', 'icon' => 'x-circle', 'color' => 'rose'],
                ['label' => 'Active Leaves', 'value' => '15', 'trend' => 'Capacity 82%', 'icon' => 'clock', 'color' => 'indigo'],
            ];
        @endphp
        @foreach($metrics as $metric)
            <div class="glass rounded-[2rem] p-6 border border-white/5 relative group overflow-hidden transition-all hover:-translate-y-1">
                <div class="absolute -right-4 -top-4 w-24 h-24 bg-{{ $metric['color'] }}-500/5 rounded-full blur-2xl group-hover:bg-{{ $metric['color'] }}-500/10 transition-colors"></div>
                <div class="flex items-center justify-between mb-6">
                    <div class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-{{ $metric['color'] }}-500">
                        <flux:icon :name="$metric['icon']" variant="mini" class="w-5 h-5" />
                    </div>
                    <span class="text-[9px] font-black text-{{ $metric['color'] }}-500 uppercase tracking-widest bg-{{ $metric['color'] }}-500/10 px-2 py-1 rounded-lg border border-{{ $metric['color'] }}-500/20">{{ $metric['trend'] }}</span>
                </div>
                <div class="space-y-1">
                    <p class="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">{{ $metric['label'] }}</p>
                    <p class="text-3xl font-black text-white tracking-tighter">{{ $metric['value'] }}</p>
                </div>
            </div>
        @endforeach
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Incoming Vectors: Pending Requests -->
        <div class="lg:col-span-12 space-y-8">
            <div class="flex items-center justify-between">
                <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    Incoming Leave Vectors
                </h3>
            </div>

            @if(count($pendingLeaveRequests) > 0)
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    @foreach ($pendingLeaveRequests as $req)
                        <div class="glass rounded-[2.5rem] p-8 border border-white/5 relative group transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/5 overflow-hidden flex flex-col h-full animate-[fadeInUp_0.5s_ease-out]">
                            <div class="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-all"></div>
                            
                            <div class="flex items-center gap-4 mb-8">
                                <div class="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-amber-500 font-black text-lg shadow-xl relative overflow-hidden">
                                    <div class="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent"></div>
                                    {{ substr($req->employee->full_name, 0, 1) }}
                                </div>
                                <div>
                                    <h4 class="text-sm font-black text-white tracking-tight leading-tight group-hover:text-amber-400 transition-colors">{{ $req->employee->full_name }}</h4>
                                    <p class="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{{ $req->leave_type }}</p>
                                </div>
                            </div>

                            <div class="bg-zinc-950/50 rounded-2xl p-6 border border-white/5 mb-8 flex-grow relative overflow-hidden group/reason">
                                <div class="absolute top-4 right-4 text-zinc-800 group-hover/reason:text-amber-500/20 transition-colors">
                                    <flux:icon name="chat-bubble-bottom-center-text" class="w-8 h-8" />
                                </div>
                                <p class="text-xs text-zinc-400 font-medium italic leading-relaxed relative z-10">"{{ $req->reason }}"</p>
                            </div>

                            <div class="space-y-4 mb-8">
                                <div class="flex items-center justify-between">
                                    <div class="space-y-1">
                                        <p class="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Duration</p>
                                        <div class="flex items-center gap-2">
                                            <flux:icon name="calendar" variant="mini" class="w-4 h-4 text-amber-500" />
                                            <span class="text-xs font-black text-white tracking-tighter">{{ (new DateTime($req->end_date))->diff(new DateTime($req->start_date))->format('%d') }} Units (Days)</span>
                                        </div>
                                    </div>
                                    <div class="text-right space-y-1">
                                        <p class="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Deployment</p>
                                        <p class="text-xs font-black text-zinc-400 tracking-tighter">{{ date('M d', strtotime($req->start_date)) }} — {{ date('M d', strtotime($req->end_date)) }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <button wire:click="rejectLeaveRequest({{ $req->id }})" class="py-3.5 bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-500 hover:border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <flux:icon name="x-mark" class="w-4 h-4" />
                                    Reject
                                </button>
                                <button wire:click="approveLeaveRequest({{ $req->id }})" class="py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <flux:icon name="check" class="w-4 h-4" />
                                    Approve
                                </button>
                            </div>
                        </div>
                    @endforeach
                </div>
            @else
                <div class="glass rounded-[3rem] p-24 text-center border border-white/5 bg-white/[0.02] flex flex-col items-center justify-center space-y-8 animate-[fadeIn_0.8s_ease-out]">
                    <div class="w-24 h-24 bg-zinc-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center text-emerald-500 shadow-2xl relative">
                        <div class="absolute inset-0 bg-emerald-500 blur-2xl opacity-10 animate-pulse"></div>
                        <flux:icon name="sparkles" class="w-12 h-12" />
                    </div>
                    <div class="space-y-2">
                        <h4 class="text-2xl font-black text-white tracking-tighter uppercase tracking-[0.2em]">Zero Resistance</h4>
                        <p class="text-sm text-zinc-500 max-w-sm mx-auto italic">All talent vectors are currently aligned. No pending time-off protocols detected.</p>
                    </div>
                </div>
            @endif
        </div>

        <!-- Fiscal History: Processed Requests -->
        <div class="lg:col-span-12 glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative mt-10">
            <div class="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-3">
                    <div class="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                    Archived Protocols
                </h3>
                <div class="flex items-center gap-2">
                    <button class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                        <flux:icon name="arrow-down-tray" class="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-zinc-900/30">
                            <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Talent Unit</th>
                            <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Leave Protocol</th>
                            <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Duration</th>
                            <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] w-1/3">Justification</th>
                            <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-white/5">
                        @forelse ($processedLeaveRequests as $req)
                            <tr class="group hover:bg-white/[0.02] transition-all duration-300">
                                <td class="px-8 py-6">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-indigo-400 font-black text-xs shadow-inner">
                                            {{ substr($req->employee->full_name, 0, 1) }}
                                        </div>
                                        <span class="text-sm font-black text-white tracking-tight group-hover:text-indigo-400 transition-colors">{{ $req->employee->full_name }}</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <span class="text-xs font-black text-zinc-400 tracking-tighter">{{ $req->leave_type }}</span>
                                </td>
                                <td class="px-8 py-6">
                                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800">
                                        <flux:icon name="calendar" variant="mini" class="w-3 h-3 text-zinc-500" />
                                        <span class="text-[10px] font-black text-zinc-300 tracking-widest">{{ (new DateTime($req->end_date))->diff(new DateTime($req->start_date))->format('%d') }}D</span>
                                    </div>
                                </td>
                                <td class="px-8 py-6">
                                    <p class="text-xs text-zinc-500 font-medium italic line-clamp-1 max-w-xs group-hover:text-zinc-400 transition-colors">"{{ $req->reason }}"</p>
                                </td>
                                <td class="px-8 py-6 text-right">
                                    @if($req->status == 'approved')
                                        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                            <span class="w-1 h-1 rounded-full bg-emerald-500"></span>
                                            Approved
                                        </span>
                                    @else
                                        <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-500 uppercase tracking-widest">
                                            <span class="w-1 h-1 rounded-full bg-rose-500"></span>
                                            Denied
                                        </span>
                                    @endif
                                </td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="5" class="px-8 py-16 text-center text-zinc-600 text-xs font-black uppercase tracking-widest italic opacity-50">Archive Core Empty</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
