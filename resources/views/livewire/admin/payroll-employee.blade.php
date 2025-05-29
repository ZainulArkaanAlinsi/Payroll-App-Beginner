<div class="p-6 min-h-screen">
    <!-- Header Section -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div class="mb-4 md:mb-0">
            <h1 class="text-2xl font-bold text-gray-800">Employee Payroll Management</h1>
            <p class="text-gray-600 mt-1">Manage employee payroll details efficiently</p>
        </div>
        <flux:button wire:click="openModal" icon="plus"
            class="bg-blue-600 hover:bg-blue-700 w-full md:w-auto justify-center">
            Add New Payroll
        </flux:button>
    </div>

    <!-- Stats & Filters -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Payroll Card -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div class="flex items-center">
                <span class="flex items-center justify-center bg-blue-600 rounded-full w-12 h-12"
                    icon="currency-dollar">
                </span>
                <div>
                    <p class="text-sm text-gray-500">Total Payroll</p>
                    <p class="text-2xl font-semibold text-gray-800">
                        ${{ number_format($totalAmount, 2) }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="lg:col-span-3 space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-4">
            <flux:input wire:model.live.debounce.300ms="search" placeholder="Search notes..." icon="magnifying-glass"
                rounded="lg" />
            <flux:input type="date" wire:model.live="filterStart" label="Start Date" rounded="lg" />
            <flux:input type="date" wire:model.live="filterEnd" label="End Date" rounded="lg" />
        </div>
    </div>

    <!-- Payroll Table -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50">
                    <tr>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            Period Start</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            Period End</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            Payment Date</th>
                        <th class="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            Notes</th>
                        <th class="px-6 py-4 text-right text-sm font-semibold text-gray-600 uppercase tracking-wider">
                            Actions</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                    @forelse($payrolls as $payroll)
                    <tr class="hover:bg-gray-50 transition-colors">
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {{ date('d M Y', strtotime($payroll->payroll_period_start)) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {{ date('d M Y', strtotime($payroll->payroll_period_end)) }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                            {{ date('d M Y', strtotime($payroll->payment_date)) }}
                        </td>
                        <td class="px-6 py-4 max-w-[300px] truncate text-sm text-gray-600">
                            {{ $payroll->notes }}
                        </td>
                        <td class="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div class="flex items-center justify-end space-x-2">
                                <flux:button icon="pencil" wire:click="openModal({{ $payroll->id }})"
                                    class="hover:bg-gray-100" />
                                <flux:button icon="trash" color="red" wire:click="openDeleteModal({{ $payroll->id }})"
                                    class="hover:bg-red-50" />
                                <flux:button wire:click="openGenerateModal({{ $payroll->id }})" size="sm" color="green"
                                    icon="document-arrow-down" class="shadow-sm">
                                    Generate
                                </flux:button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-6 py-12 text-center text-gray-500">
                            <div class="flex flex-col items-center justify-center space-y-2">
                                <span class="icon-sad w-8 h-8 text-gray-400">>
                                    <p class=" text-sm">No payroll records found</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="px-6 py-4 border-t border-gray-200">
            {{ $payrolls->links() }}
        </div>
    </div>


    <!-- Main Modal (Create/Edit) -->
    <flux:modal wire:model="showMainModal" max-width="2xl">

        <div class="space-y-6">
            <div class="flex items-center justify-between">
                <h2 class="text-xl font-semibold">
                    {{ $isEditting ? 'Edit Payroll' : 'Create Payroll' }}
                </h2>
                <flux:button icon="x-mark" wire:click="show = false" class="text-gray-400 hover:text-gray-500" />
            </div>

            <form wire:submit.prevent="save" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <flux:input type="date" wire:model="periodStart" label="Period Start" required rounded="lg" />
                    <flux:input type="date" wire:model="periodEnd" label="Period End" required rounded="lg" />
                </div>

                <flux:input type="date" wire:model="paymentDate" label="Payment Date" required rounded="lg" />

                <flux:textarea wire:model="notes" label="Notes" placeholder="Additional information..." rows="3"
                    rounded="lg" />

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-gray-700">Allowances</h3>
                        <div class="space-y-2">
                            @foreach($allowances as $allowance)
                            <flux:checkbox wire:model="selectedAllowances" value="{{ $allowance->id }}"
                                :label="$allowance->name" rounded="lg" />
                            @endforeach
                        </div>
                    </div>

                    <div class="space-y-3">
                        <h3 class="text-sm font-medium text-gray-700">Deductions</h3>
                        <div class="space-y-2">
                            @foreach($deductions as $deduction)
                            <flux:checkbox wire:model="selectedDeductions" value="{{ $deduction->id }}"
                                :label="$deduction->name" rounded="lg" />
                            @endforeach
                        </div>
                    </div>
                </div>

                <div class="flex justify-end space-x-3 pt-6">
                    <flux:button type="button" wire:click="show = false" color="gray" class="hover:bg-gray-50">
                        Cancel
                    </flux:button>
                    <flux:button type="submit" color="blue" :loading="$loading">
                        {{ $isEditting ? 'Update' : 'Create' }}
                    </flux:button>
                </div>
            </form>
        </div>

    </flux:modal>

    <!-- Delete Confirmation Modal -->
    <flux:modal wire:model="showDeleteModal" max-width="md">
        <div class="space-y-6">

            <div class="text-center space-y-6">
                <span class="icon-trash w-12 h-12 text-red-500">
                    <div class="space-y-2">
                        <h3 class="text-lg font-medium text-gray-900">Delete Payroll</h3>
                        <p class="text-sm text-gray-500">Are you sure you want to delete this payroll record? This
                            action cannot be undone.</p>
                    </div>
                    <div class="flex justify-center space-x-3">
                        <flux:button woire:click="show = false" color="gray">Cancel</flux:button>
                        <flux:button wire:click="delete" color="red">Delete</flux:button>
                    </div>
            </div>
        </div>
    </flux:modal>

    <!-- Generate Payroll Modal -->
    <flux:modal wire:model="showGenerateModal" max-width="xl">
        <div class="space-y-6">
            <div class="">
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold">Generate Payroll Slip</h2>
                        <flux:button icon="x-mark" wire:click="show = false"
                            class="text-gray-400 hover:text-gray-500" />
                    </div>

                    <div class="bg-blue-50 rounded-xl p-6 space-y-4">
                        <dl class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <dt class="text-sm font-medium text-blue-600">Period Start</dt>
                                <dd class="mt-1 text-gray-900 font-medium">
                                    {{ date('d M Y', strtotime($periodStart)) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-blue-600">Period End</dt>
                                <dd class="mt-1 text-gray-900 font-medium">
                                    {{ date('d M Y', strtotime($periodEnd)) }}
                                </dd>
                            </div>
                            <div>
                                <dt class="text-sm font-medium text-blue-600">Payment Date</dt>
                                <dd class="mt-1 text-gray-900 font-medium">
                                    {{ date('d M Y', strtotime($paymentDate)) }}
                                </dd>
                            </div>
                        </dl>
                    </div>

                    <div class="flex justify-end space-x-3">
                        <flux:button wire:click="show = false" color="gray">Cancel</x-flux-button>
                            <flux:button type="button" color="green" icon="document-arrow-down">
                                Generate PDF
                            </flux:button>
                    </div>
                </div>
            </div>
        </div>
    </flux:modal>
</div>