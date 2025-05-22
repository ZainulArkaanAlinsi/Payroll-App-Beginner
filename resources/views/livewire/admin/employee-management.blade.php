<div class="space-y-8">
    <!-- Page Heading -->
    <x-page-heading :pageHeading="__('Employee Management')"
        :pageDesc="__('Manage your employees, compensation, and payroll information')" class="mb-8"
        header-class="bg-gradient-to-r from-blue-600 to-purple-600 text-white" />

    <!-- Search and Add Button -->
    <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div class="w-full md:w-1/3">
            <flux:input wire:model.live.debounce.300ms="search" type="text" placeholder="Search employees..."
                icon="magnifying-glass" class="w-full rounded-xl" variant="outline" />
        </div>
        <flux:modal.trigger name="employee-management">
            <flux:button variant="primary" icon="plus" gradient gradient-from="from-blue-600"
                gradient-to="to-purple-600" class="shadow-lg">
                <span class="hidden md:inline">Add Employee</span>
            </flux:button>
        </flux:modal.trigger>
    </div>

    <!-- Employee Table -->
    <div
        class="overflow-x-auto rounded-3xl shadow-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-purple-50 to-white">
        <table class="min-w-full divide-y divide-blue-100">
            <thead>
                <tr
                    class="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs md:text-sm uppercase tracking-wider">
                    <th class="px-5 py-4 text-left font-bold rounded-tl-3xl">No</th>
                    <th class="px-5 py-4 text-left font-bold">Employee</th>
                    <th class="px-5 py-4 text-left font-bold">Position</th>
                    <th class="px-5 py-4 text-left font-bold">Department</th>
                    <th class="px-5 py-4 text-left font-bold">Contact</th>
                    <th class="px-5 py-4 text-left font-bold">Email</th>
                    <th class="px-5 py-4 text-left font-bold">Hire Date</th>
                    <th class="px-5 py-4 text-left font-bold">Bank</th>
                    <th class="px-5 py-4 text-left font-bold">Account</th>
                    <th class="px-5 py-4 text-left font-bold">Address</th>
                    <th class="px-5 py-4 text-left font-bold">Salary</th>
                    <th class="px-5 py-4 text-left font-bold">Frequency</th>
                    <th class="px-5 py-4 text-left font-bold">Status</th>
                    <th class="px-5 py-4 text-right font-bold rounded-tr-3xl">Actions</th>
                </tr>
            </thead>
            <tbody class="bg-white/80 divide-y divide-blue-50">
                @forelse ($employees as $index => $employee)
                <tr class="hover:bg-blue-50/70 transition-all group">
                    <td class="px-5 py-3 text-xs text-gray-500 font-semibold">{{ $employees->firstItem() + $index }}
                    </td>
                    <td class="px-5 py-3 min-w-[180px]">
                        <div class="flex items-center gap-3">
                            <flux:avatar :name="$employee->full_name" size="md" class="ring-2 ring-blue-200 shadow" />
                            <div>
                                <div class="font-semibold text-blue-900 truncate">{{ $employee->full_name }}</div>
                                <div class="text-xs text-gray-400">{{ $employee->user->name ?? '-' }}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-5 py-3 text-purple-700 text-sm font-medium truncate">
                        {{ $employee->position->name ?? '-' }}
                    </td>
                    <td class="px-5 py-3 text-xs text-gray-500 truncate">
                        {{ $employee->position->department->name ?? '-' }}
                    </td>
                    <td class="px-5 py-3 text-blue-700 text-sm">
                        <div class="flex items-center gap-1">
                            <x-icon name="phone" class="w-4 h-4 text-blue-500" />
                            <span>{{ $employee->phone }}</span>
                        </div>
                    </td>
                    <td class="px-5 py-3 text-xs text-blue-700 truncate">
                        {{ $employee->user->email ?? '-' }}
                    </td>
                    <td class="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                        @if($employee->hire_date)
                        <span>
                            {{ \Carbon\Carbon::parse($employee->hire_date)->format('d M y') }}
                        </span>
                        @else
                        <span class="text-gray-400">-</span>
                        @endif
                    </td>
                    <td class="px-5 py-3 text-xs text-gray-700 truncate">
                        {{ $employee->bank_name }}
                    </td>
                    <td class="px-5 py-3 text-xs text-gray-700 truncate">
                        {{ $employee->bank_account_number }}
                    </td>
                    <td class="px-5 py-3 text-xs text-gray-500 truncate max-w-[160px]">
                        {{ $employee->address }}
                    </td>

                    <td class="px-5 py-3 max-w-[160px]">
                        @if(isset($employee->salary) && isset($employee->salary->amount) && $employee->salary->amount >
                        0)
                        <div class="inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-1 shadow-sm max-w-full"
                            x-data="{ show: false }">
                            <x-icon name="currency-dollar" class="w-4 h-4 text-green-500" />
                            <span class="font-bold text-green-700 text-sm truncate max-w-[90px] cursor-pointer"
                                :title="'Rp {{ number_format($employee->salary->amount, 0, ',', '.') }}'">
                                Rp {{ number_format($employee->salary->amount, 0, ',', '.') }}
                            </span>
                        </div>
                        @else
                        <span
                            class="inline-block text-gray-400 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-sm">-</span>
                        @endif
                    </td>

                    <td class="px-5 py-3 text-xs text-gray-500">
                        @if(isset($employee->salary) && $employee->salary->pay_frequency)
                        {{ ucfirst($employee->salary->pay_frequency) }}
                        @else
                        <span class="text-gray-400">-</span>
                        @endif
                    </td>
                    <td class="px-5 py-3">
                        <flux:badge color="green" variant="solid"
                            class="flex items-center gap-2 px-2 py-1 rounded-full shadow text-xs font-semibold">
                            <x-icon name="user" class="w-4 h-4 text-black" />
                            <span>Employee</span>
                        </flux:badge>
                    </td>
                    <td class="px-5 py-3 text-right">
                        <div class="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition">
                            <flux:button wire:click="editEmployee({{ $employee->id }})" icon="pencil" variant="primary"
                                size="sm" class="bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-full shadow" />
                            <flux:button wire:click="deleteEmployee({{ $employee->id }})" icon="trash" variant="primary"
                                size="sm" class="bg-red-100 text-red-600 hover:bg-red-200 rounded-full shadow" />
                        </div>
                    </td>
                </tr>
                @empty
                <tr>
                    <td colspan="14" class="px-4 py-20 text-center bg-white/80 rounded-b-3xl">
                        <div class="max-w-md mx-auto flex flex-col items-center">
                            <div class="mb-5 p-6 bg-blue-100 rounded-full shadow">
                                <x-icon name="user-circle" class="w-12 h-12 text-blue-600" />
                            </div>
                            <h3 class="text-xl font-bold text-blue-900 mb-2">No employees found</h3>
                            <p class="text-blue-500 mb-6">Start building your team by adding new members</p>
                            <flux:button wire:click="showEmployeeForm" variant="primary" gradient
                                gradient-from="from-blue-600" gradient-to="to-purple-600" class="shadow-lg">
                                Add First Employee
                            </flux:button>
                        </div>
                    </td>
                </tr>
                @endforelse
            </tbody>
        </table>
        @if($employees->hasPages())
        <div
            class="px-8 py-5 border-t border-blue-100 bg-gradient-to-r from-blue-50 to-purple-50 rounded-b-3xl flex justify-between items-center">
            <span class="text-xs text-gray-500">
                Showing {{ $employees->firstItem() }} - {{ $employees->lastItem() }} of {{ $employees->total() }}
                employees
            </span>
            {{ $employees->links('flux::pagination') }}
        </div>
        @endif
    </div>

    <!-- Employee Form Modal -->
    <flux:modal name="employee-management" max-width="3xl" wire:model="showEmployeeForm" overlay-blur="sm">
        <div name="header" class="text-lg font-semibold text-blue-900">
            {{ $editMode ? 'Edit Employee' : 'Add New Employee' }}
        </div>

        <form wire:submit.prevent="saveEmployee" class="space-y-6">
            <div name="content" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Personal Info -->
                    <div class="space-y-4">
                        <h3 class="text-base font-medium text-orange-600 border-b pb-2">Personal Information</h3>

                        <div class="flex flex-col">
                            <flux:input wire:model="full_name" label="Full Name" required />
                            <flux:error for="full_name" />
                        </div>
                        <div class="flex flex-col">
                            <flux:input wire:model="phone" type="tel" label="Phone" required /> {{-- Di sini --}}
                            <flux:error for="phone" />
                        </div>

                        <div class="flex flex-col">
                            <flux:input wire:model="hire_date" type="date" label="Hire Date" />
                        </div>

                        <div class="flex flex-col">
                            <flux:select wire:model="position_id" label="Position" placeholder="Select a position">
                                @foreach ($departments as $department)
                                @if ($department->positions->isNotEmpty()) {{-- Cek jika ada positions --}}
                                @foreach ($department->positions as $position)
                                <flux:select.option value="{{ $position->id }}">
                                    {{ $department->name }} - {{ $position->name }}
                                </flux:select.option>
                                @endforeach
                                @endif
                                @endforeach
                            </flux:select>
                        </div>
                    </div>

                    <!-- Bank Info -->
                    <div class="space-y-4">
                        <h3 class="text-base font-medium text-orange-600 border-b pb-2">Bank Information</h3>

                        <div class="flex flex-col">
                            <flux:input wire:model="bank_name" label="Bank Name" required />
                            <flux:error for="bank_name" />
                        </div>

                        <div class="flex flex-col">
                            <flux:input wire:model="bank_account_number" label="Account Number" required />
                            <flux:error for="bank_account_number" />
                        </div>

                        <div class="flex flex-col label">
                            <flux:textarea wire:model="address" rows="3" label="Address" required />
                            <flux:error for="address" />
                        </div>
                    </div>
                </div>

                <!-- User Account -->
                <div class="mt-8 pt-6 border-t border-gray-200">
                    <h3 class="text-base font-medium text-orange-600 mb-4">User Account</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <flux:input wire:model="name" label="Username" required />
                            <flux:error for="name" />
                        </div>

                        <div class="flex flex-col">
                            <flux:input wire:model="email" type="email" label="Email" required />
                            <flux:error for="email" />
                        </div>

                        <div class="flex flex-col">
                            <flux:input wire:model="password" type="password" label="Password" :required="!$editMode" />
                            <flux:error for="password" />
                        </div>

                        <div class="flex flex-col">
                            <flux:input label="Role" value="Employee" readonly disabled />
                        </div>
                    </div>
                </div>



                <!-- Salary Info -->

                <div class="mt-8 pt-6 border-t border-gray-200">
                    <h3 class="text-base font-medium text-orange-600 mb-4">Salary Information</h3>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="flex flex-col">
                            <flux:input wire:model="amount" type="number" min="0" step="1000" prefix="Rp"
                                label="Base Salary" required class="w-full" input-class="text-right"
                                placeholder="Masukkan gaji pokok" />
                            <flux:error for="amount" />
                        </div>

                        <div class="flex flex-col">
                            <flux:select wire:model="pay_frequency" label="Pay Frequency">
                                <flux:select.option value="monthly">Monthly</flux:select.option>
                                <flux:select.option value="weekly">Weekly</flux:select.option>
                                <flux:select.option value="daily">Daily</flux:select.option>
                            </flux:select>
                            <flux:error for="pay_frequency" />
                        </div>

                        <div label="Effective Date" class="flex flex-col">
                            <flux:input wire:model="salary_effective_date" type="date" label="Effective Date" />
                            <flux:error for="salary_effective_date" />
                        </div>
                    </div>
                </div>




                <div name="actions" class="flex justify-end gap-3">
                    <flux:modal.close>
                        <flux:button variant="ghost" type="button" class="w-full md:w-auto">
                            {{ $editMode ? 'Cancel' : 'Close' }}
                        </flux:button>
                    </flux:modal.close>

                    <flux:button variant="primary" icon="check" type="submit" class="w-full md:w-auto">
                        {{ $editMode ? 'Update Employee' : 'Create Employee' }}
                    </flux:button>
                </div>
            </div>
            @if ($errors->any())
            <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                            fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700">
                            Terdapat error dalam form. Silakan periksa kembali input Anda.
                        </p>
                    </div>
                </div>
            </div>
            @endif
        </form>
    </flux:modal>
</div>
