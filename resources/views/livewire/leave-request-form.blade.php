<!-- resources/views/livewire/leave-form.blade.php -->
<div class="space-y-6 max-w-4xl mx-auto my-16 px-4">
    <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 border border-slate-200/60 dark:border-slate-700/60 relative overflow-hidden animate-[fadeInUp_0.5s_ease-out_0.1s_both]">
        <!-- Decorative Background Elements -->
        <div class="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-10 relative z-10 animate-[fadeIn_0.5s_ease-out_0.2s_both]">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
                <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </div>
            <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Leave Request Form</h2>
            <p class="mt-3 text-slate-500 dark:text-slate-400 max-w-lg mx-auto text-lg">Submit your time off request easily. We'll review it and get back to you shortly.</p>
        </div>

        <form wire:submit="submit" class="space-y-8 relative z-10">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {{-- TODO: Take from currently logged in user --}}
                <div class="animate-[fadeInUp_0.5s_ease-out_0.3s_both]">
                    <flux:select
                        wire:model="employee_id"
                        label="Employee Name"
                        placeholder="-- Select Employee --"
                    >
                        <option value="">-- Select Employee --</option>
                        @foreach($employees as $employee)
                            <option value="{{ $employee->id }}">{{ $employee->full_name }}</option>
                        @endforeach
                    </flux:select>
                    @error('employee_id') <span class="text-rose-500 text-sm mt-1 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{{ $message }}</span> @enderror
                </div>

                <div class="animate-[fadeInUp_0.5s_ease-out_0.4s_both]">
                    <flux:select
                        wire:model="leave_type"
                        label="Leave Type"
                        placeholder="-- Select Type --"
                    >
                        <option value="">-- Select Type --</option>
                        <option value="sick">Sick Leave (Sakit)</option>
                        <option value="vacation">Paid Time Off (Cuti)</option>
                        <option value="personal">Personal Leave (Izin)</option>
                        <option value="other">Business Trip (Dinas)</option>
                    </flux:select>
                    @error('leave_type') <span class="text-rose-500 text-sm mt-1 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{{ $message }}</span> @enderror
                </div>
            </div>

            <div class="bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50 animate-[fadeInUp_0.5s_ease-out_0.5s_both]">
                <h4 class="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Duration
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <flux:input
                            type="date"
                            wire:model="start_date"
                            label="Start Date"
                        />
                        @error('start_date') <span class="text-rose-500 text-sm mt-1 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{{ $message }}</span> @enderror
                    </div>
                    <div>
                        <flux:input
                            type="date"
                            wire:model="end_date"
                            label="End Date"
                        />
                        @error('end_date') <span class="text-rose-500 text-sm mt-1 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{{ $message }}</span> @enderror
                    </div>
                </div>
            </div>

            <div class="animate-[fadeInUp_0.5s_ease-out_0.6s_both]">
                <flux:textarea
                    wire:model="reason"
                    label="Reason for Leave"
                    placeholder="Please provide details about your leave request (optional but recommended)..."
                    rows="4"
                />
                @error('reason') <span class="text-rose-500 text-sm mt-1 flex items-center gap-1"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>{{ $message }}</span> @enderror
            </div>

            <div class="flex justify-end pt-4 animate-[fadeInUp_0.5s_ease-out_0.7s_both]">
                <flux:button type="submit" variant="primary" icon="paper-airplane"
                    class="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 hover:scale-[1.02] transition-all duration-300 border-none rounded-xl px-8 py-2.5 text-base font-semibold">
                    Submit Leave Request
                </flux:button>
            </div>
        </form>

        {{-- @if (session()->has('message'))
            <flux:alert type="success">
                {{ session('message') }}
            </flux:alert>
        @endif --}}
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