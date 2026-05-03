<div>
    <div>
        <flux:modal.trigger name="add-position">
            <flux:button icon="plus" variant="primary" type="button"
                class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 transition-all duration-300 border-none rounded-xl px-5">
                {{ __('Add Position') }}
            </flux:button>
        </flux:modal.trigger>

        <flux:modal wire:close="close" name="add-position" class="md:w-[26rem] backdrop-blur-sm">
            <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 relative overflow-hidden">
                <!-- Decorative Background -->
                <div class="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-2xl"></div>
                <div class="absolute bottom-0 left-0 -ml-8 -mb-8 w-32 h-32 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-2xl"></div>

                <form wire:submit="addPosition" class="relative z-10 space-y-6">
                    <div>
                        <div class="flex items-center gap-3 mb-2 animate-[fadeIn_0.3s_ease-out]">
                            <div class="p-2 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            </div>
                            <flux:heading size="lg" class="text-2xl font-bold text-slate-900 dark:text-white">New Position</flux:heading>
                        </div>
                        <flux:text class="text-sm text-slate-500 dark:text-slate-400 animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
                            Add a new position to your company and manage your team.
                        </flux:text>
                    </div>

                    <div class="space-y-4">
                        <div class="animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
                            <flux:input wire:model="name" label="Name" placeholder="e.g. Senior Developer" required />
                        </div>
                        
                        <div class="animate-[fadeInUp_0.4s_ease-out_0.3s_both]">
                            <flux:select label="Department" wire:model="selectedDepartment" placeholder="Select Department..." required>
                                @foreach ($departments as $department)
                                <flux:select.option value="{{ $department->id }}">
                                    {{ $department->name }}
                                </flux:select.option>
                                @endforeach
                            </flux:select>
                        </div>
                        
                        <div class="animate-[fadeInUp_0.4s_ease-out_0.4s_both]">
                            <flux:textarea wire:model="description" label="Description" placeholder="Key responsibilities..." rows="3" />
                        </div>
                    </div>

                    <div class="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 animate-[fadeInUp_0.4s_ease-out_0.5s_both]">
                        <flux:button type="button" wire:click="close" class="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl px-5 border-none">
                            Cancel
                        </flux:button>
                        <flux:button type="submit" variant="primary" icon="check"
                            class="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-500/30 hover:scale-105 transition-all duration-200 border-none rounded-xl px-6">
                            Save
                        </flux:button>
                    </div>
                </form>
            </div>
        </flux:modal>
    </div>
    
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
