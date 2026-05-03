<x-layouts.app :title="__('Organization')">
    <!-- Page Header -->
    <div class="mb-10 animate-[fadeInUp_0.5s_ease-out]">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div class="flex items-center gap-5">
                <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 transform rotate-3 transition-transform hover:rotate-6">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                </div>
                <div>
                    <h1 class="text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
                        {{ __('Organization') }}
                    </h1>
                    <p class="text-zinc-500 dark:text-zinc-400 font-medium">
                        {{ __('Architect your company structure with precision') }}
                    </p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <livewire:add-department />
                <livewire:add-position />
            </div>
        </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 gap-8 animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
        <!-- Table Section -->
        <div class="glass rounded-[2.5rem] overflow-hidden border-0">
            <div class="p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50">
                <h3 class="text-xl font-black text-zinc-900 dark:text-white">{{ __('Departments & Positions') }}</h3>
                <div class="flex items-center gap-2">
                    <span class="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest border border-indigo-500/20">Live Sync</span>
                </div>
            </div>
            
            <div class="p-4 overflow-x-auto">
                <livewire:departments-positions-table />
            </div>
        </div>

        <!-- Structure Insights (Mock) -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="glass rounded-[2.5rem] p-8 hover-scale">
                <h4 class="text-lg font-black mb-6 flex items-center gap-2">
                    <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
                    Department Distribution
                </h4>
                <div class="space-y-4">
                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between text-sm font-bold">
                            <span>Technology</span>
                            <span>42%</span>
                        </div>
                        <div class="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div class="h-full bg-indigo-600 rounded-full" style="width: 42%"></div>
                        </div>
                    </div>
                    <div class="flex flex-col gap-2">
                        <div class="flex justify-between text-sm font-bold">
                            <span>Operations</span>
                            <span>35%</span>
                        </div>
                        <div class="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div class="h-full bg-purple-600 rounded-full" style="width: 35%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass rounded-[2.5rem] p-8 hover-scale">
                <h4 class="text-lg font-black mb-6 flex items-center gap-2">
                    <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                    Growth Analytics
                </h4>
                <div class="flex items-center gap-6">
                    <div class="flex-1">
                        <p class="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">+12</p>
                        <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">New Positions</p>
                    </div>
                    <div class="flex-1 border-l border-zinc-100 dark:border-zinc-800 pl-6">
                        <p class="text-3xl font-black text-emerald-500 tracking-tighter">8.4%</p>
                        <p class="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Efficiency Gain</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</x-layouts.app>

