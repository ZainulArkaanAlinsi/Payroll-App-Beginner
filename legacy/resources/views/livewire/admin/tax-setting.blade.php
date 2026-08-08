<div>
    <x-page-heading :pageHeading="__('Tax Settings')"
        :pageDesc="__('Manage your taxes here and apply them to your employees')" />

    <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden relative animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
        <!-- Toolbar Section -->
        <div class="p-6 border-b border-slate-200/50 dark:border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-800/30">
            <div class="w-full md:w-96">
                <flux:input wire:model.debounce.300ms="search" icon="magnifying-glass"
                    placeholder="Search taxes..."
                    class="!border-slate-200 focus:!ring-2 focus:!ring-indigo-500 shadow-sm rounded-xl" />
            </div>
            <div class="w-full md:w-auto flex justify-end">
                <flux:button icon="plus" label="Add New Tax" wire:click="openTaxModal"
                    class="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 px-6 py-2 rounded-xl transition-all duration-300 w-full md:w-auto border-none" />
            </div>
        </div>

        <!-- Notification -->
        @if(session('message'))
        <div class="mx-6 mt-6 p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/30 border border-emerald-200/60 dark:border-emerald-800/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
            <p class="text-emerald-700 dark:text-emerald-400 flex items-center gap-3 font-medium">
                <svg class="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {{ session('message') }}
            </p>
        </div>
        @endif

        <!-- Tax Table -->
        <div class="overflow-x-auto p-6">
            <table class="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/30 rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <thead class="bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-md">
                    <tr class="text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th class="px-6 py-4">Tax Name</th>
                        <th class="px-6 py-4">Rate</th>
                        <th class="px-6 py-4">Threshold</th>
                        <th class="px-6 py-4 hidden md:table-cell">Description</th>
                        <th class="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white/40 dark:bg-slate-900/40 divide-y divide-slate-200/50 dark:divide-slate-700/30 backdrop-blur-sm">
                    @forelse($taxes as $index => $tax)
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-300 group hover:shadow-[inset_4px_0_0_0_#6366f1]" style="animation-delay: {{ $index * 50 }}ms;">
                        <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                    {{ substr($tax->name, 0, 1) }}
                                </div>
                                <span class="text-slate-800 dark:text-slate-200 font-semibold">{{ $tax->name }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap">
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
                                {{ number_format((float)$tax->rate, 2) }}%
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm">
                            @if($tax->threshold)
                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                Rp {{ number_format((float)$tax->threshold, 0, ',', '.') }}
                            </span>
                            @else
                            <span class="text-slate-400 dark:text-slate-500 font-medium italic">No Threshold</span>
                            @endif
                        </td>
                        <td class="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                            {{ \Illuminate\Support\Str::limit($tax->description, 50) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right">
                            <div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:opacity-100">
                                <button wire:click="editTax({{ $tax->id }})" type="button" class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-110 active:scale-95 transition-all duration-200" title="Edit Tax">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button wire:click="confirmDelete({{ $tax->id }})" type="button" class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 hover:scale-110 active:scale-95 transition-all duration-200" title="Delete Tax">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center justify-center">
                                <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <h3 class="text-sm font-medium text-slate-900 dark:text-white">No Tax Rates Found</h3>
                                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by adding a new tax configuration.</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 pb-6">
            {{ $taxes->links() }}
        </div>
    </div>

    <!-- Tax Form Modal -->
    <flux:modal wire:model="showTaxModal" class="min-w-[32rem]">
        <!-- Modal Header with Icon and Gradient -->
        <div class="px-8 py-6 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-4 shadow-lg rounded-t-xl -mx-6 -mt-6 mb-6">
            <div class="bg-white/20 rounded-2xl p-3 backdrop-blur-sm">
                <svg class="w-8 h-8 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <div>
                <h3 class="text-2xl font-bold text-white tracking-wide">
                    {{ $editId ? 'Edit Tax Rate' : 'Create New Tax Rate' }}
                </h3>
                <p class="text-indigo-100 text-sm mt-1">
                    {{ $editId ? 'Update your tax rate details below.' : 'Fill in the details to add a new tax rate.' }}
                </p>
            </div>
        </div>

        <!-- Modal Form Body -->
        <form wire:submit.prevent="saveTax" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
                <div>
                    <flux:input label="Tax Name" wire:model.defer="name" required :error="$errors->first('name')"
                        placeholder="e.g. Income Tax" />
                </div>
                <div class="flex gap-3 items-end">
                    <div class="flex-1">
                        <flux:input type="number" label="Tax Rate (%)" wire:model.defer="rate" min="0" max="100" step="0.01"
                            placeholder="0.00" id="tax-rate" :error="$errors->first('rate')" />
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 gap-6 animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
                <div>
                    <flux:input type="number" label="Threshold (Optional)" wire:model.defer="threshold" placeholder="e.g. 5000000"
                        icon="banknotes" :error="$errors->first('threshold')" />
                    <p class="text-xs text-slate-500 mt-2">Only incomes above this threshold will be taxed.</p>
                </div>
                <div>
                    <flux:textarea label="Description" wire:model.defer="description" rows="3"
                        placeholder="Enter tax description..." :error="$errors->first('description')" />
                </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700 animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
                <flux:button label="Cancel" type="button" wire:click="closeModal" variant="ghost" />
                <flux:button label="{{ $editId ? 'Update Tax' : 'Create Tax' }}" type="submit" variant="primary"
                    icon="check"
                    class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-200 border-none" />
            </div>
        </form>
    </flux:modal>

    <!-- Delete Confirmation Modal -->
    <flux:modal wire:model="confirmingDelete" class="min-w-[24rem]">
        <div class="px-6 py-4 border-b border-rose-200/50 bg-gradient-to-r from-rose-500 to-pink-500 rounded-t-xl -mx-6 -mt-6 mb-6">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                Delete Tax Rate
            </h3>
        </div>

        <div class="space-y-6">
            <div class="flex items-center justify-center">
                <div class="bg-rose-100 dark:bg-rose-900/30 rounded-full p-4 animate-bounce">
                    <svg class="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
            </div>
            
            <div class="text-center space-y-2">
                <h4 class="text-xl font-bold text-slate-800 dark:text-slate-100">Are you sure?</h4>
                <p class="text-slate-500 dark:text-slate-400">
                    This action <span class="font-bold text-rose-500">cannot be undone</span>. All related payroll data may be affected.
                </p>
            </div>
        </div>

        <div class="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-700">
            <flux:button label="Cancel" type="button" wire:click="$set('confirmingDelete', null)" variant="ghost" />
            <flux:button label="Delete Permanently" type="button" wire:click="deleteTax({{ $confirmingDelete }})"
                variant="danger" icon="trash"
                class="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5 transition-all duration-200 border-none" />
        </div>
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
