<div>
    <x-page-heading :pageHeading="__('Salary Components')" :pageDesc="__('Manage your salary components here.')" />

    <!-- Allowance Section -->
    <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden relative mb-8 animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
        <!-- Header with Add Button -->
        <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ __('Allowances') }}</h3>
            </div>

            <flux:modal.trigger name="main-modal">
                <flux:button wire:click="$set('isDeduction', false)" icon="plus" variant="primary" type="button"
                    class="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all duration-300 border-none rounded-xl">
                    <span>{{ __('Add Allowance') }}</span>
                </flux:button>
            </flux:modal.trigger>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/30">
                <!-- Table Header -->
                <thead class="bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-md">
                    <tr class="text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th class="px-6 py-4">{{ __('Name') }}</th>
                        <th class="px-6 py-4">{{ __('Amount') }}</th>
                        <th class="px-6 py-4">{{ __('Rule') }}</th>
                        <th class="px-6 py-4 text-right">{{ __('Actions') }}</th>
                    </tr>
                </thead>

                <!-- Table Body -->
                <tbody class="divide-y divide-slate-200/50 dark:divide-slate-700/30">
                    @forelse ($allowances as $index => $allowance)
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-300 group hover:shadow-[inset_4px_0_0_0_#10b981]" style="animation-delay: {{ $index * 50 }}ms;">
                        <!-- Name Column -->
                        <td class="px-6 py-4 whitespace-nowrap capitalize">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                                    {{ substr($allowance->name, 0, 1) }}
                                </div>
                                <span class="text-slate-800 dark:text-slate-200 font-medium">{{ $allowance->name }}</span>
                            </div>
                        </td>

                        <!-- Amount Column -->
                        <td class="px-6 py-4 whitespace-nowrap">
                            @if ($allowance->rule == 'fixed')
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Rp {{ number_format($allowance->amount, 0, ',', '.') }}
                            </span>
                            @else
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                {{ number_format($allowance->amount * 100, 0, ',', '.') }}%
                            </span>
                            @endif
                        </td>

                        <!-- Rule Column -->
                        <td class="px-6 py-4 whitespace-nowrap capitalize">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                {{ $allowance->rule }}
                            </span>
                        </td>

                        <!-- Actions Column -->
                        <td class="px-6 py-4 whitespace-nowrap text-right">
                            <div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:opacity-100">
                                <button wire:click="editModalAllowance({{ $allowance->id }})" type="button" class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-110 active:scale-95 transition-all duration-200" title="{{ __('Edit') }}">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>

                                <button type="button" wire:click="deleteModalAllowance(`{{ $allowance->id }}`,`{{ $allowance->name }}`)" class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 hover:scale-110 active:scale-95 transition-all duration-200" title="{{ __('Delete') }}">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="4" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                </div>
                                <h3 class="text-sm font-medium text-slate-900 dark:text-white">No Allowances Found</h3>
                                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by adding a new allowance.</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        <div class="px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            {{ $allowances->links() }}
        </div>
    </div>


    <flux:separator class="my-8 opacity-50" />


    <!-- Deduction Section -->
    <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden relative animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
        <!-- Header with Add Button -->
        <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div class="flex items-center gap-3">
                <div class="p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-slate-800 dark:text-slate-100">{{ __('Deductions') }}</h3>
            </div>

            <flux:modal.trigger name="main-modal" wire:click="$set('isDeduction', true)">
                <flux:button icon="plus" variant="primary" type="button"
                    class="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 hover:-translate-y-0.5 transition-all duration-300 border-none rounded-xl">
                    <span>{{ __('Add Deduction') }}</span>
                </flux:button>
            </flux:modal.trigger>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/30">
                <thead class="bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-md">
                    <tr class="text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th class="px-6 py-4">{{ __('Name') }}</th>
                        <th class="px-6 py-4">{{ __('Amount') }}</th>
                        <th class="px-6 py-4 text-right">{{ __('Actions') }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/50 dark:divide-slate-700/30">
                    <tr>
                        <td colspan="3" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 12H4"></path></svg>
                                </div>
                                <h3 class="text-sm font-medium text-slate-900 dark:text-white">No Deductions Found</h3>
                                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by adding a new deduction.</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>


    <!-- Flux Modal Add/Edit Form -->
    <flux:modal wire:close="closeModal" name="main-modal" class="min-w-[22rem]">
        <form @if ($isEditAllowance) @if ($isDeduction) wire:submit="updateDeduction" @else
            wire:submit="updateAllowance" @endif @else @if ($isDeduction) wire:submit="addDeduction" @else
            wire:submit="addAllowance" @endif @endif class="space-y-6">
            
            <div>
                <flux:heading size="lg" class="animate-[fadeIn_0.3s_ease-out]">
                    @if ($isEditAllowance) Edit @else Add @endif
                    @if ($isDeduction) Deduction @else Allowance @endif
                </flux:heading>
                <flux:text class="mt-2 animate-[fadeIn_0.3s_ease-out_0.1s_both]">
                    @if ($isEditAllowance)
                        Update the @if ($isDeduction) deduction @else allowance @endif details. These changes will reflect in employee salaries.
                    @else
                        Create a new @if ($isDeduction) deduction @else allowance @endif in the system.
                    @endif
                </flux:text>
            </div>

            <div class="space-y-5">
                <div class="animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
                    <flux:input wire:model="name" label="Name" placeholder="Enter name" required />
                </div>
                
                <div class="animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
                    <flux:textarea wire:model="description" label="Description" placeholder="Enter description" />
                </div>
                
                <div class="animate-[fadeInUp_0.4s_ease-out_0.4s_both]">
                    <flux:input wire:model="amount" label="Amount" placeholder="0" required />
                </div>

                @if (!$isDeduction)
                <div class="animate-[fadeInUp_0.4s_ease-out_0.5s_both] bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                    <p class="text-sm text-blue-700 dark:text-blue-300">
                        <strong>For Rule "Percentage":</strong> 1 is equal to 100%, 0.5 is equal to 50%.
                    </p>
                </div>

                <div class="animate-[fadeInUp_0.4s_ease-out_0.6s_both]">
                    <flux:select label="Rule" wire:model="rule" placeholder="Choose rule..." required>
                        <flux:select.option value="fixed">Fixed Amount</flux:select.option>
                        <flux:select.option value="percentage">Percentage (%)</flux:select.option>
                    </flux:select>
                </div>
                @endif
            </div>

            <div class="flex pt-4 animate-[fadeInUp_0.4s_ease-out_0.7s_both]">
                <flux:spacer />
                <flux:button type="submit" variant="primary" icon="check"
                    class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white hover:shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200 border-none">
                    Save Changes
                </flux:button>
            </div>
        </form>
    </flux:modal>


    <!-- Delete Confirmation Modal -->
    <flux:modal wire:close="closeModal" name="delete-modal" class="min-w-[22rem]">
        <form wire:submit="deleteAllowance" class="space-y-6">
            <div class="space-y-6">
                <div>
                    <flux:heading size="lg">Delete {{ $name }}?</flux:heading>
                    <flux:text class="mt-2">
                        <p>You're about to delete this component.</p>
                        <p>This action cannot be reversed and may affect employee payrolls.</p>
                    </flux:text>
                </div>
                <div class="flex gap-2">
                    <flux:spacer />
                    <flux:modal.close>
                        <flux:button variant="ghost">Cancel</flux:button>
                    </flux:modal.close>
                    <flux:button type="submit" variant="danger" icon="trash" class="bg-rose-500 hover:bg-rose-600">
                        Delete Now
                    </flux:button>
                </div>
            </div>
        </form>
    </flux:modal>

    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</div>