<div>
    <x-page-heading :pageHeading="__('Tax Settings')"
        :pageDesc="__('Manage your taxes here and apply them to your employees')" />

    <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-100">
        <!-- Toolbar Section -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div class="w-full md:w-1/3">
                <flux:input wire:model.debounce.300ms="search" label="Search Taxes" icon="magnifying-glass"
                    placeholder="Search by tax name..."
                    class="!border-indigo-100 focus:!ring-2 focus:!ring-indigo-500" />
            </div>
            <div class="w-full md:w-auto flex justify-end">
                <flux:button icon="plus" label="Add New Tax" wire:click="openTaxModal"
                    class="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md px-6 py-2 rounded-lg transition duration-150 w-full md:w-auto" />
            </div>
        </div>

        <!-- Notification -->
        @if(session('message'))
        <div class="mb-4 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <p class="text-emerald-700 flex items-center">
                <x-icon name="check-circle" class="w-5 h-5 mr-2 text-emerald-600" />
                {{ session('message') }}
            </p>
        </div>
        @endif

        <!-- Tax Table -->
        <div class="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-indigo-50">
                    <tr>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-indigo-700">Tax Name</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-indigo-700">Rate</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-indigo-700">Threshold</th>
                        <th class="px-4 py-3 text-left text-sm font-semibold text-indigo-700">Description</th>
                        <th class="px-4 py-3 text-right text-sm font-semibold text-indigo-700">Actions</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    @forelse($taxes as $tax)
                    <tr class="hover:bg-indigo-50/30 transition-colors">
                        <td class="px-4 py-4 text-sm font-medium text-gray-900">{{ $tax->name }}</td>
                        <td class="px-4 py-4 text-sm">
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                {{ number_format((float)$tax->rate, 2) }}%
                            </span>
                        </td>
                        <td class="px-4 py-4 text-sm">
                            @if($tax->threshold)
                            <span
                                class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                {{ number_format((float)$tax->threshold) }}
                            </span>
                            @else
                            <span class="text-gray-400">-</span>
                            @endif
                        </td>
                        <td class="px-4 py-4 text-sm text-gray-600">
                            {{ \Illuminate\Support\Str::limit($tax->description, 50) }}
                        </td>
                        <td class="px-4 py-4 text-sm text-right">
                            <div class="inline-flex items-center space-x-2">
                                <flux:button wire:click="editTax({{ $tax->id }})" icon="pencil" variant="primary" sm
                                    class="!border-indigo-300 !bg-white hover:!bg-indigo-50 text-indigo-600 shadow-sm transition duration-150"
                                    tooltip="Edit Tax" />
                                <flux:button wire:click="confirmDelete({{ $tax->id }})" icon="trash" variant="primary"
                                    sm
                                    class="!border-red-300 !bg-white hover:!bg-red-50 text-red-600 shadow-sm transition duration-150"
                                    tooltip="Delete Tax" />
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-4 py-6 text-center text-gray-500">
                            <div class="flex flex-col items-center justify-center space-y-2">
                                <x-icon name="document-magnifying-glass" class="w-8 h-8 text-gray-400" />
                                <p>No tax rates found</p>
                            </div>
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="mt-6">
            {{ $taxes->links() }}
        </div>
    </div>

    <!-- Tax Form Modal -->
    <flux:modal wire:model="showTaxModal" max-width="2xl" class="!rounded-xl overflow-hidden">
        <!-- Modal Header with Icon and Gradient -->
        <div
            class="px-8 py-6 bg-gradient-to-r from-teal-600 via-teal-400 to-cyan-400 flex items-center gap-4 shadow-lg">
            <div class="bg-white/30 rounded-full p-3">
                <x-icon name="banknotes" class="w-8 h-8 text-white drop-shadow" />
            </div>
            <div>
                <h3 class="text-2xl font-bold text-white tracking-wide">
                    {{ $editId ? 'Edit Tax Rate' : 'Create New Tax Rate' }}
                </h3>
                <p class="text-cyan-100 text-sm mt-1">
                    {{ $editId ? 'Update your tax rate details below.' : 'Fill in the details to add a new tax rate.' }}
                </p>
            </div>
        </div>

        <!-- Modal Form Body -->
        <form wire:submit.prevent="saveTax"
            class="px-8 py-8 bg-gradient-to-br from-white via-cyan-50 to-teal-50 space-y-6 shadow-lg rounded-b-xl">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <flux:input label="Tax Name" wire:model.defer="name" required :error="$errors->first('name')"
                        placeholder="e.g. Income Tax"
                        class="!bg-white !border-cyan-300 focus:!ring-cyan-500 shadow-sm" />
                </div>
                <div class="flex gap-4">
                    <flux:input type="number" label="Tax Rate (%)" wire:model.defer="rate" min="0" max="100" step="0.01"
                        placeholder="0.00" id="tax-rate" :error="$errors->first('rate')"
                        class="!bg-white !border-teal-400 focus:!ring-2 focus:!ring-teal-500 shadow-sm flex-1" />
                    <div class="flex items-end">
                        <span class="text-teal-600 font-semibold text-lg mb-2">%</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <flux:input label="Threshold" wire:model.defer="threshold" placeholder="Optional"
                        icon="currency-dollar" :error="$errors->first('threshold')"
                        class="!bg-white !border-cyan-300 focus:!ring-cyan-500 shadow-sm" />
                </div>
                <div>
                    <flux:textarea label="Description" wire:model.defer="description" rows="3"
                        placeholder="Enter tax description..." :error="$errors->first('description')"
                        class="!bg-white !border-cyan-300 focus:!ring-cyan-500 shadow-sm" />
                </div>
            </div>

            <!-- Buttons -->
            <div class="flex justify-end gap-4">
                <flux:button label="Cancel" type="button" wire:click="closeModal" variant="outline" icon="x-mark"
                    class="!border-cyan-300 text-cyan-700 hover:!bg-cyan-100 transition-all duration-150" />
                <flux:button label="{{ $editId ? 'Update Tax' : 'Create Tax' }}" type="submit" variant="primary"
                    icon="check"
                    class="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg transition-all duration-150" />
            </div>
        </form>
    </flux:modal>

    <!-- Delete Confirmation Modal -->
    <flux:modal wire:model="confirmingDelete" max-width="md" class="!rounded-xl">
        <div class="px-6 py-4 border-b bg-gradient-to-r from-red-600 to-red-500 rounded-t-xl">
            <h3 class="text-lg font-semibold text-white flex items-center">
                <x-icon name="trash" class="w-6 h-6 mr-2 text-white" />
                Delete Tax Rate
            </h3>
        </div>

        <div class="px-6 py-8 space-y-5 bg-white rounded-b-xl">
            <div class="flex items-center justify-center">
                <div class="bg-red-100 rounded-full p-4">
                    <x-icon name="exclamation-triangle" class="w-14 h-14 text-red-500" />
                </div>
            </div>
            <p class="text-center text-lg font-semibold text-red-700">
                Are you sure you want to delete this tax rate?
            </p>
            <p class="text-center text-gray-500">
                This action <span class="font-semibold text-red-600">cannot be undone</span>. All related data may be
                affected.
            </p>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-3 bg-gray-50 rounded-b-xl">
            <flux:button label="Cancel" type="button" wire:click="$set('confirmingDelete', null)" variant="outline"
                icon="x-mark"
                class="!border-gray-300 text-gray-700 hover:!bg-gray-100 transition-colors duration-150" />
            <flux:button label="Delete Permanently" type="button" wire:click="deleteTax({{ $confirmingDelete }})"
                variant="danger" icon="trash"
                class="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-red-sm flex items-center transition-colors duration-150">
                Delete
            </flux:button>
        </div>
    </flux:modal>
</div>
