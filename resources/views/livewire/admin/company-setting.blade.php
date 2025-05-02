<div> <!-- Ini root tag utama yang dibutuhkan Livewire -->
    <div class="max-w-3xl mx-auto">
        <!-- Card Container with subtle hover animation -->
        <div
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-200 hover:shadow-md">

            <!-- Header with animation -->
            <div class="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-6 py-5 transform transition-all duration-300 opacity-0 -translate-y-2 animate-show">
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">
                            {{ __('Company Settings') }}
                        </h1>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ __('Manage your company profile and information') }}
                        </p>
                    </div>
                    <div class="flex-shrink-0 scale-0 animate-pop">
                        <span
                            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200">
                            {{ __('Admin') }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Form Content -->
            <form wire:submit.prevent="updateCompany" class="px-6 py-5 space-y-6">
                <!-- Grid Layout with staggered animations -->
                <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <!-- Company Name -->
                    <div class="sm:col-span-2 opacity-0 translate-y-4 animate-fade-in delay-100">
                        <flux:input wire:model="name" :label="__('Company Name')" type="text" required autofocus
                            autocomplete="name"
                            class="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                            placeholder="Enter your company name" :dark-mode="true" />
                    </div>

                    <!-- Company Description -->
                    <div class="sm:col-span-2 opacity-0 translate-y-4 animate-fade-in delay-200">
                        <flux:input wire:model="description" :label="__('Company Description')" required rows="5"
                            class="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 min-h-[120px] transition-all duration-200"
                            placeholder="Brief description about your company" :dark-mode="true" />
                    </div>

                    <!-- Address -->
                    <div class="opacity-0 translate-y-4 animate-fade-in delay-300">
                        <flux:input wire:model="address" :label="__('Company Address')" type="text" required
                            autocomplete="address"
                            class="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                            placeholder="Street address" :dark-mode="true" />
                    </div>

                    <!-- Phone -->
                    <div class="opacity-0 translate-y-4 animate-fade-in delay-400">
                        <flux:input wire:model="phone" :label="__('Company Phone')" type="tel" required autocomplete="phone"
                            class="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                            placeholder="+1 (555) 000-0000" :dark-mode="true" />
                    </div>

                    <!-- Company Value -->
                    <div class="sm:col-span-2 opacity-0 translate-y-4 animate-fade-in delay-500">
                        <flux:input wire:model="value" :label="__('Company Value')" type="text" required
                            autocomplete="value"
                            class="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-all duration-200"
                            placeholder="Core values or mission statement" :dark-mode="true" />
                    </div>
                </div>

                <!-- Form Footer with animation -->
                <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-700 opacity-0 translate-y-4 animate-fade-in delay-600">
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
                        class="px-6 py-2.5 text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-95 dark:bg-indigo-600 dark:hover:bg-indigo-700">
                        {{ __('Save') }}
                    </flux:button>
                </div>
            </form>
        </div>
    </div>

    <style>
        .animate-show {
            animation: show 0.4s ease-out forwards;
        }

        .animate-pop {
            animation: pop 0.3s 0.2s ease-out forwards;
        }

        .animate-fade-in {
            animation: fadeInUp 0.4s ease-out forwards;
        }

        @keyframes show {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes pop {
            0% {
                transform: scale(0.8);
                opacity: 0;
            }
            70% {
                transform: scale(1.1);
            }
            100% {
                transform: scale(1);
                opacity: 1;
            }
        }

        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .delay-100 {
            animation-delay: 0.1s;
        }
        .delay-200 {
            animation-delay: 0.2s;
        }
        .delay-300 {
            animation-delay: 0.3s;
        }
        .delay-400 {
            animation-delay: 0.4s;
        }
        .delay-500 {
            animation-delay: 0.5s;
        }
        .delay-600 {
            animation-delay: 0.6s;
        }
    </style>
</div>
