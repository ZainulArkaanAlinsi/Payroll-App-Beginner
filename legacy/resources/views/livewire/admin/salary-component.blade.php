<div>
    <x-page-heading :pageHeading="__('Salary Components')" :pageDesc="__('Manage your salary components here.')" />

    <!-- Allowance Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <!-- Header with Add Button -->
        <div class="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 class="text-lg font-semibold text-gray-800">{{ __('Allowances') }}</h3>


            <flux:modal.trigger name="main-modal">
                <flux:button icon="plus" variant="primary" type="button"
                    class="flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                    <span>{{ __('Add Allowance') }}</span>
                </flux:button>
            </flux:modal.trigger>

        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
            <table class="w-full">
                <!-- Table Header -->
                <thead class="bg-gray-50">
                    <thead class="bg-gray-50">
                        <tr class="text-left text-sm font-medium text-gray-500 tracking-wider">
                            <th class="px-6 py-3">{{ __('Name') }}</th>
                            <th class="px-6 py-3">{{ __('Amount') }}</th>
                            <th class="px-6 py-3">{{ __('Rule') }}</th>
                            <th class="px-6 py-3 text-right">{{ __('Actions') }}</th>
                        </tr>
                    </thead>

                    <!-- Table Body -->
                <tbody class="divide-y divide-gray-100">
                    @foreach ($allowances as $allowance)
                    <tr class="hover:bg-gray-50 transition-colors duration-150">
                        <!-- Name Column -->
                        <td class="px-6 py-4 whitespace-nowrap capitalize">
                            <span class="text-gray-800 font-medium">{{ $allowance->name }}</span>
                        </td>

                        <!-- Amount Column -->
                        <td class="px-6 py-4 whitespace-nowrap text-gray-500">
                            {{-- add currency --}}
                            @if ($allowance->rule == 'fixed')
                            {{-- add currency --}}
                            Rp {{ number_format($allowance->amount, 0, ',', '.') }}
                            @else
                            {{--jadiin persen--}}
                            {{ number_format($allowance->amount * 100, 0, ',', '.') }}%
                            @endif
                        </td>

                        <!-- Rule Column -->
                        <td class="px-6 py-4 whitespace-nowrap capitalize">
                            <span
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {{ $allowance->rule }}
                            </span>
                        </td>

                        <!-- Actions Column -->
                        <td class="px-6 py-4 whitespace-nowrap text-right">
                            <div class="flex justify-end space-x-2">
                                <!-- Edit Button -->
                                <flux:button wire:click="editModalAllowance({{ $allowance->id }})" icon="pencil-square"
                                    variant="primary" type="button"
                                    class="p-2 text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-lg transition-colors duration-200">
                                    {{ __('Edit') }}
                                </flux:button>

                                <!-- Delete Button -->
                                <flux:button icon="trash" variant="primary" type="button"
                                    wire:click="deleteModalAllowance(`{{ $allowance->id }}`,`{{ $allowance->name }}`)"
                                    class="p-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-lg transition-colors duration-200">
                                    {{ __('Delete') }}
                                </flux:button>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
            {{ $allowances->links() }}
        </div>
    </div>






    <!-- Flux Modal Add Allowance -->
    <flux:modal wire:close="closeModal" name="main-modal" class="min-w-[22rem]">
        <form @if ($isEditAllowance) @if ($isDeduction) wire:submit="updateDeduction" @else
            wire:submit="updateAllowance" @endif @else @if ($isDeduction) wire:submit="addDeduction" @else
            wire:submit="addAllowance" @endif @endif class="space-y-6">
            <flux:heading size="lg">
                @if ($isEditAllowance) Edit @else New @endif
                @if ($isDeduction) Deduction @else Allowance @endif
            </flux:heading>
            <flux:text class="mt-2 animate-fade-in">
                @if ($isEditAllowance)
                @if ($isDeduction)
                Update deduction to the system.this will be reflected in the salary of your
                employees.
                @else
                Update allowance to the system.this will be reflected in the salary of your
                employees.
                @endif

                @else

                @if ($isDeduction)
                Add deduction to the system.this will be reflected in the salary of your
                employees.
                @else
                Add allowance to the system.this will be reflected in the salary of your
                employees.
                @endif
                @endif
            </flux:text>




            <flux:input wire:model="name" label="Name" placeholder="Name" required
                class="animate-slide-in-left delay-100" />
            <flux:textarea wire:model="description" label="Description" placeholder="Position Description"
                class="animate-slide-in-left delay-200" />
            <flux:input wire:model="amount" label="Amount" placeholder="Amount" required
                class="animate-slide-in-left delay-100" />


            @if (!$isDeduction)
            <flux:text class="animate-slide-in-left delay-200">
                <p class="text-sm text-gray-500">For Rule "Percentage".<br /> 1 is equal to 100%, <br /> 0.5 is equal to
                    50%</p>
            </flux:text>


            <flux:select label="Rule" wire:model="rule" placeholder="Choose rule ..." required>
                <flux:select.option value="fixed">Fixed</flux:select.option>
                <flux:select.option value="percentage">Percentage</flux:select.option>
            </flux:select>
            @endif


            <div class="flex">
                <flux:spacer />
                <flux:button type="submit" variant="primary" icon="check"
                    class="hover:scale-105 transition-transform duration-200 animate-bounce-in delay-300">Save
                </flux:button>
            </div>


        </form>
    </flux:modal>




    <flux:modal wire:close="closeModal" name="delete-modal" class="min-w-[22rem]">
        <form wire:submit="deleteAllowance" class="space-y-6"></form>
        <div class="space-y-6">
            <div>
                <flux:heading size="lg">Delete {{ $name }}?</flux:heading>
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
                <flux:button type="submit" variant="danger" icon="trash">Delete Now
                </flux:button>
            </div>
        </div>
    </flux:modal>


    <flux:separator class="my-6" />



    <!-- Deduction Section -->
    <div class="bg-white shadow-md rounded-lg p-6">
        <flux:modal.trigger name="main-modal" wire:click="$set('isDeduction', true)">
            <div class="flex justify-between items-center mb-4">
                <flux:button icon="plus" variant="primary" type="button"
                    class="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition duration-300">

                    {{ __('Add Deduction') }}
                </flux:button>
            </div>
        </flux:modal.trigger>








        <table class="w-full table-auto border-collapse">
            <thead>
                <tr class="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                    <th class="py-3 px-6 text-left">{{ __('Name') }}</th>
                    <th class="py-3 px-6 text-left">{{ __('Amount') }}</th>
                    <th class="py-3 px-6 text-center">{{ __('Actions') }}</th>
                </tr>
            </thead>
            <tbody class="text-gray-600 text-sm font-light">
                <!-- Example Row -->
            </tbody>
        </table>
    </div>
</div>