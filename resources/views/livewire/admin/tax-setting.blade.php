<div>
    <x-page-heading :pageHeading="__('Tax Settings')"
        :pageDesc="__('Manage your taxes here and apply them to your employees')" />

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <!-- Form Section -->
        <div class="mb-8">
            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                {{ $editId ? __('Edit Tax Rate') : __('Add New Tax Rate') }}
            </h2>

            <form wire:submit.prevent="{{ $editId ? 'updateTax' : 'saveTax' }}">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ __('Tax Name') }}</label>
                        <input wire:model="name" id="name"
                            class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            type="text" required />
                        @error('name') <span class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label for="rate" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ __('Tax Rate (%)') }}</label>
                        <input wire:model="rate" id="rate"
                            class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            type="number" step="0.01" min="0" max="100" required />
                        @error('rate') <span class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</span> @enderror
                    </div>

                    <div class="md:col-span-2">
                        <label for="description" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ __('Description') }}</label>
                        <textarea wire:model="description" id="description"
                            class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            rows="3"></textarea>
                        @error('description') <span class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</span> @enderror
                    </div>

                    <div>
                        <label for="threshold" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ __('Threshold (if any)') }}</label>
                        <input wire:model="threshold" id="threshold"
                            class="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm py-2 px-3 focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            type="text" />
                        @error('threshold') <span class="mt-2 text-sm text-red-600 dark:text-red-400">{{ $message }}</span> @enderror
                    </div>
                </div>

                <div class="flex justify-end mt-6 space-x-4">
                    @if($editId)
                    <button wire:click="resetInputFields" type="button"
                        class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {{ __('Cancel') }}
                    </button>
                    @endif
                    <button type="submit"
                        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {{ $editId ? __('Update') : __('Save') }}
                    </button>
                </div>
            </form>
        </div>

        <!-- Search and List Section -->
        <div>
            <div class="flex justify-between items-center mb-6">
                <div class="w-full md:w-1/3">
                    <input wire:model.debounce.500ms="search"
                        class="block w-full rounded-md border-gray-300 dark:border-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="{{ __('Search taxes...') }}" />
                </div>
            </div>

            @if (session()->has('message'))
            <div class="mb-6 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-300 rounded">
                {{ session('message') }}
            </div>
            @endif

            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead class="bg-blue-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {{ __('Name') }}
                            </th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {{ __('Rate') }}
                            </th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {{ __('Threshold') }}
                            </th>
                            <th scope="col"
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {{ __('Description') }}
                            </th>
                            <th scope="col"
                                class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                {{ __('Actions') }}
                            </th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        @forelse ($taxes as $tax)
                        <tr>
                            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                {{ $tax->name }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {{ $tax->rate }}%
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                {{ $tax->threshold ?? '-' }}
                            </td>
                            <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                {{ Str::limit($tax->description, 50) }}
                            </td>
                            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button wire:click="editTax({{ $tax->id }})"
                                    class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-500 mr-3">
                                    {{ __('Edit') }}
                                </button>
                                <button wire:click="deleteTax({{ $tax->id }})" class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-500"
                                    onclick="return confirm('Are you sure?')">
                                    {{ __('Delete') }}
                                </button>
                            </td>
                        </tr>
                        @empty
                        <tr>
                            <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-300">
                                {{ __('No tax rates found.') }}
                            </td>
                        </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>

            <div class="mt-4">
                {{ $taxes->links() }}
            </div>
        </div>
    </div>
</div>
