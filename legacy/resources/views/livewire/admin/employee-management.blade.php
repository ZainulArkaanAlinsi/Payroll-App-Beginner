<div class="flex flex-col gap-10 p-6 lg:p-12 animate-[fadeIn_0.6s_ease-out]">
    <!-- Master Header: High-Impact Typography -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div class="space-y-3">
            <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 animate-pulse">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Human Capital Cloud
            </div>
            <h1 class="text-5xl font-black tracking-tighter text-white leading-tight">
                Employee <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-600">Directorate</span>
            </h1>
            <p class="text-zinc-500 font-medium text-lg max-w-2xl italic leading-relaxed">Orchestrating your talent ecosystem with high-precision data and seamless management protocols.</p>
        </div>
        
        <div class="flex items-center gap-4">
            <flux:modal.trigger name="employee-management">
                <button class="group relative px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 overflow-hidden">
                    <div class="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <span class="relative flex items-center gap-2">
                        <flux:icon name="plus" class="w-5 h-5" />
                        Onboard Talent
                    </span>
                </button>
            </flux:modal.trigger>
        </div>
    </div>

    <!-- Insight Pulse: Quick Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        @php 
            $metrics = [
                ['label' => 'Headcount', 'value' => $employees->total(), 'trend' => '+2.5%', 'icon' => 'user-group', 'color' => 'indigo'],
                ['label' => 'Active Units', 'value' => $departments->count(), 'trend' => 'Stable', 'icon' => 'building-office', 'color' => 'purple'],
                ['label' => 'New Joiners', 'value' => '12', 'trend' => 'This Month', 'icon' => 'sparkles', 'color' => 'emerald'],
                ['label' => 'Avg Tenure', 'value' => '2.4y', 'trend' => 'Optimal', 'icon' => 'clock', 'color' => 'amber'],
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

    <!-- Data Core: High-Fidelity Table -->
    <div class="glass rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl relative">
        <!-- Table Controls -->
        <div class="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5">
            <div class="w-full md:w-96 relative group">
                <div class="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-indigo-500 transition-colors">
                    <flux:icon name="magnifying-glass" class="w-5 h-5" />
                </div>
                <input wire:model.live.debounce.300ms="search" type="text" placeholder="Search the directorate..." 
                    class="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all shadow-inner">
            </div>
            
            <div class="flex items-center gap-3">
                <button class="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95">
                    <flux:icon name="funnel" class="w-4 h-4" />
                    Filters
                </button>
                <button class="px-5 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 active:scale-95">
                    <flux:icon name="arrow-down-tray" class="w-4 h-4" />
                    Export
                </button>
            </div>
        </div>

        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-zinc-900/30">
                        <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Employee Identity</th>
                        <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Deployment</th>
                        <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Communication</th>
                        <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Compensation</th>
                        <th class="px-8 py-5 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-white/5">
                    @forelse ($employees as $employee)
                        <tr class="group hover:bg-white/[0.02] transition-all duration-300">
                            <td class="px-8 py-6">
                                <div class="flex items-center gap-5">
                                    <div class="relative">
                                        <div class="absolute inset-0 bg-indigo-500 blur-lg opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        <div class="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center relative z-10 overflow-hidden shadow-xl">
                                            <span class="text-indigo-400 font-black text-lg">{{ $employee->initials() }}</span>
                                        </div>
                                        <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-[3px] border-zinc-950 rounded-full z-20"></div>
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">{{ $employee->full_name }}</p>
                                        <p class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{{ $employee->user->email ?? 'no-email@system.id' }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-6">
                                <div class="space-y-2">
                                    <p class="text-xs font-black text-zinc-200 tracking-tight">{{ $employee->position->name ?? 'Unassigned' }}</p>
                                    <div class="inline-flex items-center gap-2 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                        <span class="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{{ $employee->position->department->name ?? 'General' }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-6">
                                <div class="space-y-1.5">
                                    <div class="flex items-center gap-2">
                                        <flux:icon name="phone" class="w-3.5 h-3.5 text-zinc-600" />
                                        <span class="text-xs font-bold text-zinc-400 tracking-tighter">{{ $employee->phone }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <flux:icon name="calendar" class="w-3.5 h-3.5 text-zinc-600" />
                                        <span class="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{{ \Carbon\Carbon::parse($employee->hire_date)->format('M d, Y') }}</span>
                                    </div>
                                </div>
                            </td>
                            <td class="px-8 py-6">
                                <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 inline-block">
                                    <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Base Salary</p>
                                    <p class="text-sm font-black text-white tracking-tighter">Rp {{ number_format($employee->salary->amount ?? 0, 0, ',', '.') }}</p>
                                </div>
                            </td>
                            <td class="px-8 py-6 text-right">
                                <div class="flex justify-end gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                    <button wire:click="editEmployee({{ $employee->id }})" class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all active:scale-90">
                                        <flux:icon name="pencil" class="w-4 h-4" />
                                    </button>
                                    <button wire:click="deleteEmployee({{ $employee->id }})" class="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 hover:text-rose-500 hover:border-rose-500/30 transition-all active:scale-90">
                                        <flux:icon name="trash" class="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="px-8 py-32 text-center">
                                <div class="flex flex-col items-center justify-center space-y-6 max-w-sm mx-auto">
                                    <div class="w-24 h-24 bg-zinc-900 rounded-[2rem] flex items-center justify-center text-zinc-800 border border-white/5 shadow-inner">
                                        <flux:icon name="user-group" class="w-12 h-12" />
                                    </div>
                                    <div class="space-y-2">
                                        <h3 class="text-xl font-black text-white tracking-tight">The Directorate is Empty</h3>
                                        <p class="text-sm text-zinc-500 font-medium italic">Start your enterprise journey by onboarding your first team member.</p>
                                    </div>
                                    <flux:modal.trigger name="employee-management">
                                        <button class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all">Begin Onboarding</button>
                                    </flux:modal.trigger>
                                </div>
                            </td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        @if($employees->hasPages())
            <div class="p-8 border-t border-white/5 bg-zinc-950/50 flex flex-col md:flex-row justify-between items-center gap-6">
                <p class="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    Displaying Index <span class="text-zinc-400">{{ $employees->firstItem() }}-{{ $employees->lastItem() }}</span> / <span class="text-indigo-500">{{ $employees->total() }}</span> Units
                </p>
                <div class="w-full md:w-auto">
                    {{ $employees->links('flux::pagination') }}
                </div>
            </div>
        @endif
    </div>

    <!-- Master Form Modal: Dark Premium -->
    <flux:modal name="employee-management" max-width="4xl" wire:model="showEmployeeForm" class="p-0 overflow-hidden glass-dark rounded-[3rem] border-white/10">
        <div class="bg-gradient-to-r from-indigo-600 to-purple-600 p-10 relative overflow-hidden">
            <div class="absolute -right-10 -top-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
            <div class="relative z-10 flex items-center justify-between">
                <div class="space-y-2">
                    <h2 class="text-4xl font-black text-white tracking-tighter">{{ $editMode ? 'Protocol: Edit' : 'Protocol: New' }}</h2>
                    <p class="text-indigo-100 font-bold text-xs uppercase tracking-widest opacity-80 italic">Precision Talent Orchestration Mode</p>
                </div>
                <button wire:click="$set('showEmployeeForm', false)" class="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-2xl flex items-center justify-center text-white transition-colors backdrop-blur-xl">
                    <flux:icon name="x-mark" class="w-6 h-6" />
                </button>
            </div>
        </div>

        <form wire:submit.prevent="saveEmployee" class="p-10 space-y-12 bg-zinc-950">
            <!-- Grid Layout for Form -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <!-- Section: Biological Identity -->
                <div class="space-y-8">
                    <div class="flex items-center gap-3">
                        <div class="w-1 h-8 bg-indigo-500 rounded-full"></div>
                        <h3 class="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Identity Details</h3>
                    </div>
                    
                    <div class="space-y-6">
                        <flux:input wire:model="full_name" label="Legal Full Name" required class="premium-input" />
                        <div class="grid grid-cols-2 gap-4">
                            <flux:input wire:model="phone" type="tel" label="Contact Line" required />
                            <flux:input wire:model="hire_date" type="date" label="Activation Date" required />
                        </div>
                        <flux:select wire:model="position_id" label="Structural Unit & Position" placeholder="Select deployment zone" required>
                            @foreach ($departments as $department)
                                @if ($department->positions->isNotEmpty())
                                    <optgroup label="{{ strtoupper($department->name) }}">
                                    @foreach ($department->positions as $position)
                                        <option value="{{ $position->id }}">{{ $position->name }}</option>
                                    @endforeach
                                    </optgroup>
                                @endif
                            @endforeach
                        </flux:select>
                    </div>
                </div>

                <!-- Section: Financial Vector -->
                <div class="space-y-8">
                    <div class="flex items-center gap-3">
                        <div class="w-1 h-8 bg-emerald-500 rounded-full"></div>
                        <h3 class="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Financial Matrix</h3>
                    </div>
                    
                    <div class="space-y-6">
                        <div class="grid grid-cols-2 gap-4">
                            <flux:input wire:model="bank_name" label="Bank Institution" required />
                            <flux:input wire:model="bank_account_number" label="Account ID" required />
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <flux:input wire:model="amount" type="number" prefix="Rp" label="Base Compensation" required />
                            <flux:select wire:model="pay_frequency" label="Payout Velocity" required>
                                <flux:select.option value="monthly">Monthly</flux:select.option>
                                <flux:select.option value="weekly">Weekly</flux:select.option>
                                <flux:select.option value="daily">Daily</flux:select.option>
                            </flux:select>
                        </div>
                        <flux:input wire:model="salary_effective_date" type="date" label="Fiscal Start Date" required />
                    </div>
                </div>
            </div>

            <!-- Global Location -->
            <div class="space-y-6">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-8 bg-purple-500 rounded-full"></div>
                    <h3 class="text-xs font-black text-zinc-400 uppercase tracking-[0.3em]">Geographic Deployment</h3>
                </div>
                <flux:textarea wire:model="address" rows="3" label="Primary Residence Address" required class="bg-zinc-900 border-zinc-800 rounded-2xl" />
            </div>

            <!-- Access Keys -->
            <div class="space-y-8 p-8 bg-indigo-600/5 border border-indigo-500/10 rounded-[2rem]">
                <div class="flex items-center gap-3">
                    <div class="w-1 h-8 bg-indigo-400 rounded-full"></div>
                    <h3 class="text-xs font-black text-indigo-400 uppercase tracking-[0.3em]">Access Credentials</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <flux:input wire:model="name" label="System ID" required />
                    <flux:input wire:model="email" type="email" label="Neural Mail" required />
                    <flux:input wire:model="password" type="password" label="Cryptographic Key" :required="!$editMode" />
                </div>
            </div>

            <div class="pt-10 flex flex-col sm:flex-row justify-end gap-4 border-t border-white/5">
                <button wire:click="$set('showEmployeeForm', false)" type="button" class="px-8 py-4 border border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-900 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">
                    Abort Command
                </button>
                <button type="submit" class="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/40 transition-all active:scale-95 flex items-center gap-2">
                    <flux:icon name="check-circle" class="w-5 h-5" />
                    {{ $editMode ? 'Confirm Override' : 'Finalize Onboarding' }}
                </button>
            </div>
        </form>
    </flux:modal>

    <style>
        .custom-scrollbar::-webkit-scrollbar { height: 10px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99,102,241,0.4); }

        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .glass-dark {
            background: linear-gradient(135deg, rgba(9, 9, 11, 0.95) 0%, rgba(18, 18, 23, 0.95) 100%);
            backdrop-blur: 40px;
        }

        [data-flux-control] {
            @apply !bg-zinc-950 !border-zinc-800 !rounded-2xl !py-3 !px-4 !text-sm !font-bold !text-white !placeholder-zinc-600 !transition-all;
        }
        [data-flux-control]:focus {
            @apply !border-indigo-500/50 !ring-4 !ring-indigo-500/10;
        }
        [data-flux-label] {
            @apply !text-[9px] !font-black !text-zinc-500 !uppercase !tracking-[0.2em] !mb-2 !ml-1;
        }
    </style>
</div>
