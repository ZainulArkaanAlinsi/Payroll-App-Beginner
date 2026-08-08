<div>
    <div class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden relative">
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/30">
                <thead class="bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-md">
                    <tr>
                        <th
                            class="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300 group">
                            <div class="flex items-center space-x-2">
                                <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                                <span class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                    {{ __('Department') }}
                                </span>
                            </div>
                        </th>
                        <th
                            class="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300 group">
                            <div class="flex items-center space-x-2">
                                <div class="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-500 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <span class="group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {{ __('Position') }}
                                </span>
                            </div>
                        </th>
                        <th
                            class="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">
                            {{ __('Actions') }}
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-200/50 dark:divide-slate-700/30">
                    @forelse ($positions as $index => $position)
                    <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all duration-300 hover:shadow-[inset_4px_0_0_0_#6366f1] dark:hover:shadow-[inset_4px_0_0_0_#818cf8] animate-[fadeInUp_0.4s_ease-out_both]" style="animation-delay: {{ $index * 50 }}ms;">
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                            <div class="flex items-center gap-3">
                                <div class="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                                    {{ substr($position->department->name, 0, 1) }}
                                </div>
                                {{ $position->department->name }}
                            </div>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                {{ $position->name }}
                            </span>
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div class="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 sm:opacity-100">
                                <button wire:click="editModal({{ $position->id }})" type="button"
                                    class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-700 dark:hover:text-indigo-300 hover:scale-110 active:scale-95 transition-all duration-200" title="{{ __('Edit') }}">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>

                                <flux:modal.trigger :name="'delete-position-' . $position->id" class="inline-flex">
                                    <button type="button"
                                        class="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 hover:text-rose-700 dark:hover:text-rose-300 hover:scale-110 active:scale-95 transition-all duration-200" title="{{ __('Delete') }}">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </flux:modal.trigger>
                                
                                <flux:modal :name="'delete-position-' . $position->id" class="min-w-[22rem]">
                                    <div class="space-y-6">
                                        <div>
                                            <flux:heading size="lg">Delete {{ $position->name }}?</flux:heading>
                                            <flux:text class="mt-2">
                                                <p>You're about to delete this position.</p>
                                                <p>This action cannot be reversed.</p>
                                            </flux:text>
                                        </div>
                                        <div class="flex gap-2">
                                            <flux:spacer />
                                            <flux:modal.close>
                                                <flux:button variant="ghost">Cancel</flux:button>
                                            </flux:modal.close>
                                            <flux:button type="submit" variant="danger"
                                                wire:click="deletePosition({{ $position->id }})">Delete Now</flux:button>
                                        </div>
                                    </div>
                                </flux:modal>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="3" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease-out]">
                                <div class="w-16 h-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                                    <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                    </svg>
                                </div>
                                <h3 class="text-sm font-medium text-slate-900 dark:text-white">No Positions Found</h3>
                                <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">Get started by creating a new position.</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>
        
        <div class="px-6 py-4 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30">
            {{ $positions->links() }}
        </div>
    </div>

    <flux:modal wire:close="closeEditModal" name="edit-position" class="min-w-[22rem]">
        <form wire:submit="updatePosition" class="space-y-6">
            <div>
                <flux:heading size="lg" class="animate-[fadeIn_0.3s_ease-out]">Edit Position</flux:heading>
                <flux:text class="mt-2 animate-[fadeIn_0.3s_ease-out_0.1s_both]">Update position in the system. This will allow you to manage your positions more effectively.</flux:text>
            </div>

            <div class="animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
                <flux:input wire:model="name" label="Name" placeholder="Position Name" required />
            </div>
            
            <div class="animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
                <flux:textarea wire:model="description" label="Description" placeholder="Position Description" />
            </div>

            <div class="animate-[fadeInUp_0.4s_ease-out_0.4s_both]">
                <flux:select label="Department" wire:model="selectedDepartment" placeholder="Choose Your Department..." required>
                    @foreach ($departments as $department)
                    <flux:select.option :value="$department->id">
                        {{ $department->name }}
                    </flux:select.option>
                    @endforeach
                </flux:select>
            </div>

            <div class="flex animate-[fadeInUp_0.4s_ease-out_0.5s_both]">
                <flux:spacer />
                <flux:button type="submit" variant="primary" icon="check"
                    class="hover:scale-105 transition-transform duration-200 hover:shadow-lg hover:shadow-indigo-500/30">Save
                </flux:button>
            </div>
        </form>
    </flux:modal>

    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</div>
