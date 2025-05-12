<div>
    <table class="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/30">
        <thead class="bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <tr>
                <th
                    class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300 group">
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {{ __('Department') }}
                        </span>
                    </div>
                </th>
                <th
                    class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300 group">
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {{ __('Position') }}
                        </span>
                    </div>
                </th>
                <th
                    class="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300">
                    {{ __('Actions') }}
                </th>
            </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200/50 dark:bg-slate-800/70 dark:divide-slate-700/30">
            @foreach ($positions as $position)
            <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100">
                    {{ $position->department->name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {{ $position->name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">



                        <flux:button  wire:click="editModal({{ $position->id }})" variant="primary" size="sm" icon="pencil" type="button"
                            class="text-indigo-600 hover:bg-indigo-50/70 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-105">
                            {{ __('Edit') }}
                        </flux:button>



                        <flux:modal.trigger :name="'delete-position-' . $position->id" class="inline-flex">
                            <flux:button variant="primary" size="sm" icon="trash" type="button"
                                class="text-rose-600 hover:bg-rose-50/70 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-all duration-200 hover:scale-105">
                                {{ __('Delete') }}
                            </flux:button>
                        </flux:modal.trigger>
                        <flux:modal :name="'delete-position-' . $position->id" class="min-w-[22rem]">
                            <div class="space-y-6">
                                <div>
                                    <flux:heading size="lg">Delete {{ $position->name }}?</flux:heading>
                                    <flux:text class="mt-2">
                                        <p>You're about to delete this project.</p>
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
            @endforeach
        </tbody>
    </table>






    {{ $positions->links() }}





    <flux:modal wire:close="closeEditModal" name="edit-position" class="min-w-[22rem]">
        <form wire:submit="updatePosition" class="space-y-6">

            <div>
                <flux:heading size="lg" class="animate-fade-in">Edit Position</flux:heading>
                <flux:text class="mt-2 animate-fade-in"> update position to the system. this will allow to manage your
                    positions more affectively
                </flux:text>
            </div>



            <flux:input wire:model="name" label="Name" placeholder="Position Name" required
                class="animate-slide-in-left delay-100" />
            <flux:textarea wire:model="description" label="Description" placeholder="Position Description"
                class="animate-slide-in-left delay-200" />




            <flux:select label="Department" wire:model="selectedDepartment" placeholder="Choose Your Department ..."
                required>
                @foreach ($departments as $department)
                <flux:select.option : value="{{
                $department->id }}">
                    {{ $department->name }}
                </flux:select.option>
                @endforeach
            </flux:select>




            <div class="flex">
                <flux:spacer />
                <flux:button type="submit" variant="primary" icon="check"
                    class="hover:scale-105 transition-transform duration-200 animate-bounce-in delay-300">Save
                </flux:button>
            </div>


        </form>
        
    </flux:modal>


</div>
