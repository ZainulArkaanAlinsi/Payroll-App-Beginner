<div class="space-y-6">
    <!-- Page Heading -->
    <x-page-heading :pageHeading="__('Employee Management')"
        :pageDesc="__('Manage your employees, compensation, and payroll information')" class="mb-6" />

    <!-- Search and Add Button -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div class="w-full md:w-1/3">
            <flux:input wire:model.live.debounce.300ms="search" type="text"
                placeholder="Search employees by name, position..." icon="magnifying-glass" class="w-full" />
        </div>
        <flux:modal.trigger name="employee-management">
            <flux:button variant="primary" icon="plus" class="w-full md:w-auto">
                <span class="hidden md:inline">Add Employee</span>
            </flux:button>
        </flux:modal.trigger>
    </div>

    <!-- Employee Table -->
    <div class="overflow-hidden bg-white rounded-lg shadow">
        <!-- Table Header -->
        <div
            class="grid grid-cols-12 bg-gray-50 px-6 py-3 border-b border-gray-200 text-sm font-semibold text-gray-700">
            <div class="col-span-3 md:col-span-2">Employee</div>
            <div class="col-span-2 hidden md:block">Position</div>
            <div class="col-span-3 md:col-span-2">Contact</div>
            <div class="col-span-2 hidden md:block">Hire Date</div>
            <div class="col-span-2">Status</div>
            <div class="col-span-2 text-right">Actions</div>
        </div>

        <!-- Table Body -->
        <div class="divide-y divide-gray-200">
            @forelse ($employees as $employee)
            <div class="grid grid-cols-12 items-center px-6 py-4 hover:bg-gray-50 transition-colors duration-150">
                <!-- Employee -->
                <div class="col-span-3 md:col-span-2 flex items-center gap-3">
                    <flux:avatar :name="$employee->full_name" size="sm" />
                    <div class="truncate">
                        <div class="font-medium truncate">{{ $employee->full_name }}</div>
                        <div class="text-xs text-gray-500 truncate">#{{ $employee->bank_account_number }}</div>
                    </div>
                </div>

                <!-- Position -->
                <div class="col-span-2 hidden md:block text-gray-600 truncate">
                    {{ $employee->position->name ?? '-' }}
                </div>

                <!-- Contact -->
                <div class="col-span-3 md:col-span-2 text-gray-600">
                    {{ $employee->phone }}
                </div>

                <!-- Hire Date -->
                <div class="col-span-2 hidden md:block text-gray-600">
                    {{ $employee->hire_date->format('M d, Y') }}
                </div>

                <!-- Status -->
                <div class="col-span-2">
                    @if($employee->user)
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        {{ $employee->user->role === 'admin' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800' }}">
                        {{ ucfirst($employee->user->role) }}
                    </span>
                    @else
                    <span
                        class="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                        No Account
                    </span>
                    @endif
                </div>

                <!-- Actions -->
                <div class="col-span-2 flex justify-end gap-1">
                    <flux:button wire:click="showEmployeeForm({{ $employee->id }})" icon="pencil" variant="icon"
                        class="text-blue-600 hover:bg-blue-50" title="Edit" />
                    <flux:button wire:click="showSalaryForm({{ $employee->id }})" icon="dollar-sign" variant="icon"
                        class="text-green-600 hover:bg-green-50" title="Salary" />
                    <flux:button wire:click="deleteEmployee({{ $employee->id }})" icon="trash" variant="icon"
                        onclick="confirm('Are you sure?') || event.stopImmediatePropagation()"
                        class="text-red-600 hover:bg-red-50" title="Delete" />
                </div>
            </div>
            @empty
            <div class="px-6 py-12 text-center">
                <div class="mx-auto max-w-md flex flex-col items-center">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900">No employees</h3>
                    <p class="mt-1 text-sm text-gray-500">Get started by adding a new employee</p>
                    <div class="mt-4">
                        <flux:button wire:click="showEmployeeForm" variant="primary" size="sm">
                            Add Employee
                        </flux:button>
                    </div>
                </div>
            </div>
            @endforelse
        </div>

        <!-- Pagination -->
        @if($employees->hasPages())
        <div class="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {{ $employees->links() }}
        </div>
        @endif
    </div>

    <!-- Employee Form Modal -->
    <flux:modal name="employee-management" max-width="2xl">
        <div name="header" class="text-lg font-semibold text-orange-600">x  
            {{ $editMode ? 'Edit Employee' : 'Add New Employee' }}
        </div>

        <div name="content" class="space-y-6">
            <div wire:submit.prevent="saveEmployee">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Personal Info -->
                    <div class="space-y-4">
                        <h3 class="text-base font-medium text-orange-600 border-b pb-2">Personal Information</h3>

                        <flux:input label="Full Name" required>
                            <flux:input wire:model="full_name" />
                            <flux:error for="full_name" />
                        </flux:input>

                        <flux:input label="Phone" required>
                            <flux:input wire:model="phone" type="tel" />
                            <flux:error for="phone" />
                        </flux:input>

                        <flux:input label="Hire Date" required>
                            <flux:input wire:model="hire_date" type="date" />
                            <flux:error for="hire_date" />
                        </flux:input>

                        <flux:input label="Position" required>
                            <flux:select wire:model="position_id" placeholder="Select position">
                                @foreach($positions as $position)
                                <option value="{{ $position->id }}">{{ $position->name }}</option>
                                @endforeach
                            </flux:select>
                            <flux:error for="position_id" />
                        </flux:input>
                    </div>

                    <!-- Bank Info -->
                    <div class="space-y-4">
                        <h3 class="text-base font-medium text-orange-600 border-b pb-2">Bank Information</h3>

                        <flux:input label="Bank Name" required>
                            <flux:input wire:model="bank_name" />
                            <flux:error for="bank_name" />
                        </flux:input>

                        <flux:input label="Account Number" required>
                            <flux:input wire:model="bank_account_number" />
                            <flux:error for="bank_account_number" />
                        </flux:input>

                        <flux:input label="Address" required>
                            <flux:textarea wire:model="address" rows="3" />
                            <flux:error for="address" />
                        </flux:input>
                    </div>
                </div>

                <!-- User Account -->
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <h3 class="text-base font-medium text-white mb-4">User Account</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <flux:input label="Username" required>
                            <flux:input wire:model="name" />
                            <flux:error for="name" />
                        </flux:input>

                        <flux:input label="Email" required>
                            <flux:input wire:model="email" type="email" />
                            <flux:error for="email" />
                        </flux:input>

                        <flux:input label="Password" :required="!$editMode">
                            <flux:input wire:model="password" type="password" />
                            <flux:error for="password" />
                        </flux:input>

                        <flux:input label="Role" required>
                            <flux:select wire:model="role">
                                <flux:select.option value="employee">Employee</flux:select.option>
                                <flux:select.option value="admin">Admin</flux:select.option>
                            </flux:select>
                            <flux:error for="role" />
                        </flux:input>
                    </div>
                </div>

                <!-- Salary Info -->
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <h3 class="text-base font-medium text-gray-900 mb-4">Salary Information</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <flux:input label="Base Salary" required>
                            <flux:input wire:model="base_salary" type="number" prefix="$" />
                            <flux:error for="base_salary" />
                        </flux:input>

                        <flux:input label="Pay Frequency" required>
                            <flux:select wire:model="pay_frequency">
                                <flux:select.option value="monthly">Monthly</flux:select.option>
                                <flux:select.option value="weekly">Weekly</flux:select.option>
                                <flux:select.option value="daily">Daily</flux:select.option>
                            </flux:select>
                            <flux:error for="pay_frequency" />
                        </flux:input>

                        <flux:input label="Effective Date" required>
                            <flux:input wire:model="salary_effective_date" type="date" />
                            <flux:error for="salary_effective_date" />
                        </flux:input>
                    </div>
                </div>
            </div>
        </div>

        <div name="actions" class="flex justify-end gap-3">
            <flux:button wire:click="$set('showEmployeeForm', false)" variant="ghost">
                {{ $editMode ? 'Cancel' : 'Close' }}
            </flux:button>
            <flux:button wire:click="saveEmployee" variant="primary">
                {{ $editMode ? 'Update Employee' : 'Create Employee' }}
            </flux:button>
        </div>
    </flux:modal>
</div>
