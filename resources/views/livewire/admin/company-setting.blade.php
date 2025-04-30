{{-- <div>
    <x-page-heading :pageHeading="__('Company Settings')" :pageDesc="__('Manage your company settings')" class="mb-6" />


    <form wire:submit.prevent="updateCompany" class="my-6 w-full space-y-6 " clas>
        <flux:input wire:model="name" :label="__('Company Name')" type="text" required autofocus autocomplete="name" />
        <flux:input wire:model="description" :label="__('Company Description')" required rows="4" />
        <flux:input wire:model="address" :label="__('Company Address')" type="text" required autocomplete="address" />
        <flux:input wire:model="phone" :label="__('Company Phone')" type="tel" required autocomplete="phone" />
        <flux:input wire:model="value" :label="__('Company Value')" type="text" required autocomplete="value" />





        <div class="flex items-center gap-4">
            <div class="flex items-center justify-end">
                <flux:button variant="primary" type="submit" class="w-full">{{ __('Save') }}</flux:button>
            </div>


            <x-action-message class="me-3" on="company-updated">
                {{ __('Saved.') }}
            </x-action-message>
        </div>

    </form>

</div> --}}

<div class="max-w-3xl mx-auto">
    <!-- Card Container -->
    <div
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
        <!-- Header with subtle accent -->
        <div class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-5">
            <div class="flex items-center justify-between">
                <div>
                    <h1 class="text-xl font-semibold text-gray-900 dark:text-white">{{ __('Company Settings') }}</h1>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ __('Manage your company profile and
                        information') }}</p>
                </div>
                <div class="flex-shrink-0">
                    <span
                        class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                        {{ __('Admin') }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Form Content -->
        <form wire:submit.prevent="updateCompany" class="px-6 py-5 space-y-6">
            <!-- Grid Layout -->
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <!-- Company Name (Full Width) -->
                <div class="sm:col-span-2">
                    <flux:input wire:model="name" :label="__('Company Name')" type="text" required autofocus
                        autocomplete="name"
                        class="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder="Enter your company name" :dark-mode="true" />
                </div>

                <!-- Company Description (Full Width) -->
                <div class="sm:col-span-2">
                    <flux:input wire:model="description" :label="__('Company Description')" required rows="5"
                        class="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 min-h-[120px]"
                        placeholder="Brief description about your company" :dark-mode="true" />
                </div>

                <!-- Address -->
                <flux:input wire:model="address" :label="__('Company Address')" type="text" required
                    autocomplete="address"
                    class="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="Street address" :dark-mode="true" />

                <!-- Phone -->
                <flux:input wire:model="phone" :label="__('Company Phone')" type="tel" required autocomplete="phone"
                    class="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                    placeholder="+1 (555) 000-0000" :dark-mode="true" />

                <!-- Company Value (Full Width) -->
                <div class="sm:col-span-2">
                    <flux:input wire:model="value" :label="__('Company Value')" type="text" required
                        autocomplete="value"
                        class="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
                        placeholder="Core values or mission statement" :dark-mode="true" />
                </div>
            </div>

            <!-- Form Footer -->
            <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700">
                <x-action-message
                    class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 transition-opacity duration-300"
                    on="company-updated">
                    <svg class="-ml-0.5 mr-1.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd" />
                    </svg>
                    {{ __('Settings saved successfully') }}
                </x-action-message>

                <flux:button variant="primary" type="submit"
                    class="px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all dark:bg-indigo-600 dark:hover:bg-indigo-700">
                    {{ __('Save') }}
                </flux:button>
            </div>
        </form>
    </div>
</div>
