<div class="flex flex-col gap-10 p-6 lg:p-12 animate-[fadeIn_0.6s_ease-out]">
    <!-- Financial Nexus Header -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-2">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Treasury & Disbursement
            </div>
            <h1 class="text-5xl font-black tracking-tighter text-white leading-tight">
                Financial <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-indigo-600">Nexus</span>
            </h1>
            <p class="text-zinc-500 font-medium text-lg max-w-2xl italic leading-relaxed">Precision fiscal orchestration. Automating complex compensation structures with zero-error protocols.</p>
        </div>
        
        <div class="flex items-center gap-4">
            <button class="group relative px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-emerald-600/30 active:scale-95 overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                <span class="relative flex items-center gap-2">
                    <flux:icon name="bolt" class="w-5 h-5" />
                    Process Payroll
                </span>
            </button>
        </div>
    </div>

    <!-- Capital Pulse: Fiscal Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        @php 
            $stats = [
                ['label' => 'Total Liquidity', 'value' => 'Rp 1.2B', 'trend' => '+12%', 'icon' => 'banknotes', 'color' => 'emerald'],
                ['label' => 'Pending Payouts', 'value' => '142', 'trend' => 'Action Req', 'icon' => 'clock', 'color' => 'amber'],
                ['label' => 'Tax Compliance', 'value' => '100%', 'trend' => 'Secure', 'icon' => 'shield-check', 'color' => 'indigo'],
            ];
        @endphp
        @foreach($stats as $stat)
            <div class="glass rounded-[2rem] p-8 border border-white/5 relative group transition-all hover:-translate-y-1 overflow-hidden">
                <div class="absolute -right-8 -top-8 w-32 h-32 bg-{{ $stat['color'] }}-500/5 rounded-full blur-3xl group-hover:bg-{{ $stat['color'] }}-500/10 transition-colors"></div>
                <div class="flex items-center justify-between mb-8">
                    <div class="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-{{ $stat['color'] }}-500 shadow-inner group-hover:scale-110 transition-transform">
                        <flux:icon :name="$stat['icon']" class="w-6 h-6" />
                    </div>
                    <span class="text-[10px] font-black text-{{ $stat['color'] }}-500 uppercase tracking-widest bg-{{ $stat['color'] }}-500/10 px-3 py-1.5 rounded-xl border border-{{ $stat['color'] }}-500/20">{{ $stat['trend'] }}</span>
                </div>
                <div class="space-y-1">
                    <p class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{{ $stat['label'] }}</p>
                    <p class="text-4xl font-black text-white tracking-tighter">{{ $stat['value'] }}</p>
                </div>
            </div>
        @endforeach
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <!-- Automated Engine: Processing Interface -->
        <div class="lg:col-span-8 glass rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden h-full">
            <div class="flex items-center justify-between mb-12">
                <div class="space-y-1">
                    <h3 class="text-2xl font-black text-white tracking-tight">Processing Engine</h3>
                    <p class="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Automated Compensation Vector</p>
                </div>
                <div class="flex items-center gap-2">
                    <div class="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-3">
                        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        <span class="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Engine Optimized</span>
                    </div>
                </div>
            </div>

            <!-- Phase Selection -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                @php 
                    $phases = [
                        ['id' => '01', 'title' => 'Data Sync', 'desc' => 'Validating presence logs', 'status' => 'complete'],
                        ['id' => '02', 'title' => 'Tax Engine', 'desc' => 'PPH-21 auto-calculation', 'status' => 'active'],
                        ['id' => '03', 'title' => 'Disbursement', 'desc' => 'Bank portal synchronization', 'status' => 'pending'],
                    ];
                @endphp
                @foreach($phases as $phase)
                    <div class="p-6 rounded-3xl border {{ $phase['status'] == 'active' ? 'bg-indigo-600/10 border-indigo-500/30' : 'bg-zinc-900/40 border-white/5' }} transition-all relative overflow-hidden group">
                        @if($phase['status'] == 'complete')
                            <div class="absolute top-4 right-4 text-emerald-500">
                                <flux:icon name="check-circle" class="w-5 h-5" />
                            </div>
                        @endif
                        <span class="text-[10px] font-black text-zinc-600 mb-4 block">{{ $phase['id'] }}</span>
                        <h4 class="text-sm font-black text-white mb-1">{{ $phase['title'] }}</h4>
                        <p class="text-[10px] text-zinc-500 font-medium italic">{{ $phase['desc'] }}</p>
                    </div>
                @endforeach
            </div>

            <div class="relative bg-zinc-950 rounded-[2rem] p-10 border border-white/5 shadow-inner overflow-hidden">
                <div class="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-emerald-600/5 opacity-50"></div>
                <div class="relative z-10 flex flex-col items-center justify-center space-y-8 py-10">
                    <div class="w-24 h-24 bg-zinc-900 rounded-[2.5rem] border border-white/5 flex items-center justify-center shadow-2xl">
                        <flux:icon name="cpu-chip" class="w-12 h-12 text-indigo-500 animate-pulse" />
                    </div>
                    <div class="text-center space-y-2">
                        <h4 class="text-xl font-black text-white tracking-tight">Ready for Generation</h4>
                        <p class="text-xs text-zinc-500 max-w-xs mx-auto italic">System has detected 142 active contracts for the May 2026 fiscal period.</p>
                    </div>
                    <button class="px-10 py-4 bg-white text-zinc-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        Initialize Nexus Engine
                    </button>
                </div>
            </div>
        </div>

        <!-- Digital Ledger: History & Logs -->
        <div class="lg:col-span-4 space-y-8 h-full">
            <div class="glass rounded-[2.5rem] p-10 border border-white/5 h-full">
                <div class="flex items-center justify-between mb-10">
                    <h3 class="text-xs font-black text-zinc-500 uppercase tracking-[0.2em]">Fiscal Ledger</h3>
                    <flux:icon name="list-bullet" class="w-5 h-5 text-zinc-700" />
                </div>

                <div class="space-y-6">
                    @php 
                        $history = [
                            ['month' => 'APRIL 2026', 'amount' => 'Rp 1.18B', 'status' => 'Disbursed', 'color' => 'emerald'],
                            ['month' => 'MARCH 2026', 'amount' => 'Rp 1.15B', 'status' => 'Disbursed', 'color' => 'emerald'],
                            ['month' => 'FEBRUARY 2026', 'amount' => 'Rp 1.21B', 'status' => 'Archived', 'color' => 'zinc'],
                        ];
                    @endphp
                    @foreach($history as $item)
                        <div class="group p-5 bg-zinc-900/40 hover:bg-zinc-900 rounded-[1.5rem] border border-white/5 transition-all cursor-pointer">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{{ $item['month'] }}</span>
                                <div class="px-2 py-0.5 rounded-lg bg-{{ $item['color'] }}-500/10 border border-{{ $item['color'] }}-500/20">
                                    <span class="text-{{ $item['color'] }}-500 text-[8px] font-black uppercase tracking-tighter">{{ $item['status'] }}</span>
                                </div>
                            </div>
                            <div class="flex items-end justify-between">
                                <p class="text-xl font-black text-white tracking-tighter">{{ $item['amount'] }}</p>
                                <button class="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-white transition-colors">
                                    <flux:icon name="arrow-down-tray" variant="mini" class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    @endforeach
                </div>

                <button class="w-full mt-10 py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-[10px] font-black text-zinc-500 hover:text-white uppercase tracking-[0.2em] transition-all">
                    View Complete History
                </button>
            </div>
        </div>
    </div>

    <style>
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
    </style>
</div>