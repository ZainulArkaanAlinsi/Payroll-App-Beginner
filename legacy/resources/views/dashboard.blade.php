<x-layouts.app :title="__('Dashboard')">
    <div class="flex h-full w-full flex-1 flex-col gap-10 p-6 lg:p-12 min-h-screen animate-[fadeIn_0.8s_ease-out]">
        
        <!-- Welcome Hero: Operational Intelligence -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div class="space-y-4">
                <div class="flex items-center gap-3">
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">
                        <span class="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                        System Online: v4.2.0
                    </div>
                    <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Low Latency
                    </div>
                </div>
                <h1 class="text-6xl font-black tracking-tighter text-white leading-tight">
                    Nexus <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600 italic">Interface</span>
                </h1>
                <p class="text-zinc-500 font-medium text-lg max-w-xl italic leading-relaxed">
                    Greetings, <span class="text-white font-black not-italic">{{ explode(' ', auth()->user()->name)[0] }}</span>. 
                    All operational sectors are currently within optimal performance parameters.
                </p>
            </div>
            
            <div class="flex items-center gap-4">
                <div class="glass px-8 py-5 rounded-[2rem] flex items-center gap-6 border border-white/5 shadow-2xl relative overflow-hidden group">
                    <div class="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div class="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center text-indigo-500 border border-zinc-800 shadow-inner group-hover:rotate-12 transition-transform">
                        <flux:icon name="calendar" class="w-7 h-7" />
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-1">{{ date('l') }}</span>
                        <span class="text-xl font-black text-white tracking-tighter">{{ date('F j, Y') }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Metric Pulse: Real-Time Vectors -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @php 
                $stats = [
                    ['label' => 'Total Headcount', 'value' => '142', 'color' => 'indigo', 'trend' => '▲ 4.2%', 'icon' => 'user-group', 'desc' => 'Active Contracts'],
                    ['label' => 'Operational Rate', 'value' => '90.1%', 'color' => 'emerald', 'trend' => 'Optimal', 'icon' => 'bolt', 'desc' => 'Presence Index'],
                    ['label' => 'Pending Vectors', 'value' => '05', 'color' => 'rose', 'trend' => 'Critical', 'icon' => 'cpu-chip', 'desc' => 'Action Required'],
                ];
            @endphp

            @foreach($stats as $stat)
                <div class="group glass rounded-[2.5rem] p-8 border border-white/5 relative overflow-hidden transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-{{ $stat['color'] }}-500/5">
                    <div class="absolute -right-12 -top-12 w-40 h-40 bg-{{ $stat['color'] }}-500/5 rounded-full blur-3xl group-hover:bg-{{ $stat['color'] }}-500/10 transition-all duration-700"></div>
                    
                    <div class="flex items-center justify-between mb-10 relative z-10">
                        <div class="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center text-{{ $stat['color'] }}-500 shadow-inner group-hover:scale-110 transition-transform">
                            <flux:icon :name="$stat['icon']" variant="mini" class="w-7 h-7" />
                        </div>
                        <div class="px-3 py-1.5 rounded-xl bg-{{ $stat['color'] }}-500/10 border border-{{ $stat['color'] }}-500/20">
                            <span class="text-{{ $stat['color'] }}-500 text-[10px] font-black tracking-widest uppercase">{{ $stat['trend'] }}</span>
                        </div>
                    </div>
                    
                    <div class="relative z-10 space-y-2">
                        <h3 class="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] ml-1">{{ $stat['label'] }}</h3>
                        <div class="flex items-baseline gap-3">
                            <span class="text-6xl font-black text-white tracking-tighter">{{ $stat['value'] }}</span>
                            <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">{{ $stat['desc'] }}</span>
                        </div>
                    </div>
                </div>
            @endforeach
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <!-- Attendance Dynamics: Analytical Core -->
            <div class="lg:col-span-8 glass rounded-[3rem] p-12 border border-white/5 relative overflow-hidden flex flex-col h-full">
                <div class="flex items-center justify-between mb-20 relative z-10">
                    <div class="space-y-2">
                        <h3 class="text-3xl font-black text-white tracking-tighter">Attendance Dynamics</h3>
                        <p class="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] flex items-center gap-2">
                            <span class="w-1 h-1 rounded-full bg-indigo-500"></span>
                            Bi-Weekly Performance Index
                        </p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button class="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95">
                            <flux:icon name="arrow-down-tray" class="w-4 h-4" />
                            Report
                        </button>
                    </div>
                </div>
                
                <div class="flex-grow flex items-end justify-between px-4 gap-12 relative">
                    <!-- Grid Lines Overlay -->
                    <div class="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                        @for($i=0; $i<5; $i++) <div class="w-full h-px bg-white"></div> @endfor
                    </div>

                    @php $heights = [45, 75, 55, 90, 65, 85, 40]; $days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']; @endphp
                    @foreach($days as $index => $day)
                        <div class="flex-1 flex flex-col items-center gap-8 group relative z-10">
                            <div class="w-full relative h-64">
                                <div class="absolute inset-x-0 bottom-0 top-0 bg-white/[0.02] rounded-2xl border border-white/5"></div>
                                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-indigo-600 via-indigo-500 to-indigo-400 rounded-2xl transition-all duration-1000 group-hover:scale-y-[1.05] group-hover:brightness-125 shadow-2xl shadow-indigo-600/20 group-hover:shadow-indigo-600/40" style="height: {{ $heights[$index] }}%">
                                    <div class="absolute -top-12 left-0 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-y-4 group-hover:translate-y-0">
                                        <div class="px-3 py-1.5 bg-white text-zinc-950 rounded-lg text-[10px] font-black tracking-widest shadow-2xl">
                                            {{ $heights[$index] }}%
                                        </div>
                                    </div>
                                    <!-- Scanline effect -->
                                    <div class="absolute top-0 inset-x-0 h-1 bg-white/30 animate-[shimmer_2s_infinite]"></div>
                                </div>
                            </div>
                            <span class="text-[10px] font-black text-zinc-600 group-hover:text-indigo-400 transition-all uppercase tracking-[0.3em]">{{ $day }}</span>
                        </div>
                    @endforeach
                </div>
            </div>

            <!-- Command Hub & Ledger -->
            <div class="lg:col-span-4 space-y-10">
                <div class="glass rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
                    <div class="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl"></div>
                    <h3 class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10 ml-1">System Commands</h3>
                    <div class="grid grid-cols-2 gap-6 relative z-10">
                        @php 
                            $actions = [
                                ['label' => 'Staff+', 'icon' => 'plus', 'color' => 'indigo', 'route' => 'admin.employee-management'],
                                ['label' => 'Audit', 'icon' => 'chart-bar', 'color' => 'amber', 'route' => 'dashboard'],
                                ['label' => 'Pay', 'icon' => 'banknotes', 'color' => 'emerald', 'route' => 'admin.payroll-employee'],
                                ['label' => 'Nexus', 'icon' => 'cog-8-tooth', 'color' => 'purple', 'route' => 'admin.company-settings'],
                            ];
                        @endphp
                        @foreach($actions as $action)
                            <a href="{{ route($action['route']) }}" class="flex flex-col items-center justify-center p-6 bg-zinc-900/40 hover:bg-zinc-900 rounded-[2rem] border border-white/5 transition-all group active:scale-95 shadow-inner" wire:navigate>
                                <div class="w-12 h-12 bg-zinc-950 border border-zinc-800 rounded-2xl flex items-center justify-center text-zinc-600 group-hover:text-{{ $action['color'] == 'indigo' ? 'indigo-500' : ($action['color'] == 'amber' ? 'amber-500' : ($action['color'] == 'emerald' ? 'emerald-500' : 'purple-500')) }} group-hover:scale-110 group-hover:rotate-6 transition-all mb-4 shadow-2xl">
                                    <flux:icon :name="$action['icon']" class="w-6 h-6" />
                                </div>
                                <span class="text-[10px] font-black text-zinc-500 group-hover:text-zinc-200 uppercase tracking-widest transition-colors">{{ $action['label'] }}</span>
                            </a>
                        @endforeach
                    </div>
                </div>

                <div class="glass rounded-[2.5rem] p-10 border border-white/5 overflow-hidden">
                    <div class="flex items-center justify-between mb-12 ml-1">
                        <h3 class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Live Ledger</h3>
                        <div class="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span class="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active Feed</span>
                        </div>
                    </div>
                    <div class="space-y-10 relative">
                        <div class="absolute left-[7px] top-2 bottom-2 w-[1px] bg-zinc-900"></div>
                        
                        <div class="flex gap-8 items-start relative z-10 group cursor-pointer">
                            <div class="w-4 h-4 rounded-full bg-indigo-600 ring-8 ring-zinc-950 flex-shrink-0 mt-1 transition-all group-hover:scale-125 group-hover:bg-indigo-400"></div>
                            <div class="flex-1 space-y-1">
                                <p class="text-sm font-black text-zinc-200 group-hover:text-indigo-400 transition-colors">Terminal login success</p>
                                <p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Ahmad Fauzi • 08:02 AM</p>
                            </div>
                        </div>
                        
                        <div class="flex gap-8 items-start relative z-10 group cursor-pointer">
                            <div class="w-4 h-4 rounded-full bg-emerald-500 ring-8 ring-zinc-950 flex-shrink-0 mt-1 transition-all group-hover:scale-125 group-hover:bg-emerald-400"></div>
                            <div class="flex-1 space-y-1">
                                <p class="text-sm font-black text-zinc-200 group-hover:text-emerald-400 transition-colors">Leave protocol approved</p>
                                <p class="text-[10px] text-zinc-600 font-bold uppercase tracking-widest italic">Siti Aminah • Annual</p>
                            </div>
                        </div>
                    </div>
                    
                    <button class="w-full mt-12 py-4 bg-zinc-950 border border-zinc-900 rounded-2xl text-[10px] font-black text-zinc-600 hover:text-white uppercase tracking-[0.3em] transition-all active:scale-95 shadow-inner">
                        Sync Ledger Core
                    </button>
                </div>
            </div>
        </div>
    </div>

    <style>
        @keyframes shimmer {
            0% { transform: translateY(100%); opacity: 0; }
            50% { opacity: 0.5; }
            100% { transform: translateY(-100%); opacity: 0; }
        }
    </style>
</x-layouts.app>


