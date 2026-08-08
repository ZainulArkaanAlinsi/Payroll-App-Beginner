<div> <!-- Ini root tag utama yang dibutuhkan Livewire -->
    <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <!-- Header Section -->
        <div class="mb-8 animate-[fadeIn_0.5s_ease-out]">
            <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
                <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                </div>
                Company Settings
            </h2>
            <p class="mt-2 text-sm text-slate-500 dark:text-slate-400 ml-15">
                Manage your company profile, branding, and contact information
            </p>
        </div>

        <!-- Card Container with subtle hover animation -->
        <div class="bg-white dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-slate-200/60 dark:border-slate-700/60 overflow-hidden transition-all duration-300 relative animate-[fadeInUp_0.5s_ease-out_0.2s_both]">
            <div class="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <!-- Form Content -->
            <form wire:submit.prevent="updateCompany" class="relative z-10">
                <div class="p-8 sm:p-10 space-y-8">
                    <!-- Grid Layout with staggered animations -->
                    <div class="grid grid-cols-1 gap-8 sm:grid-cols-2">
                        
                        <!-- Company Name -->
                        <div class="sm:col-span-2 group">
                            <flux:input wire:model="name" :label="__('Company Name')" type="text" required autofocus
                                autocomplete="name"
                                class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-900/50 shadow-sm transition-all duration-200 group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                                placeholder="Enter your company name" :dark-mode="true" />
                        </div>

                        <!-- Company Description -->
                        <div class="sm:col-span-2 group">
                            <flux:textarea wire:model="description" :label="__('Company Description')" required rows="4"
                                class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-900/50 shadow-sm transition-all duration-200 resize-none group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                                placeholder="Brief description about your company's mission and vision" :dark-mode="true" />
                        </div>

                        <!-- Address -->
                        <div class="group">
                            <flux:input wire:model="address" :label="__('Company Address')" type="text" required
                                autocomplete="address"
                                class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-900/50 shadow-sm transition-all duration-200 group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                                placeholder="Street address" :dark-mode="true" />
                        </div>

                        <!-- Phone -->
                        <div class="group">
                            <flux:input wire:model="phone" :label="__('Company Phone')" type="tel" required autocomplete="phone"
                                class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-900/50 shadow-sm transition-all duration-200 group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                                placeholder="+1 (555) 000-0000" :dark-mode="true" />
                        </div>

                        <!-- Company Value -->
                        <div class="sm:col-span-2 group">
                            <flux:input wire:model="value" :label="__('Company Core Values')" type="text" required
                                autocomplete="value"
                                class="w-full rounded-xl border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-500 dark:bg-slate-900/50 shadow-sm transition-all duration-200 group-hover:border-indigo-300 dark:group-hover:border-indigo-700"
                                placeholder="e.g. Innovation, Integrity, Excellence" :dark-mode="true" />
                        </div>
                    </div>
                </div>

                <!-- Form Footer with animation -->
                <div class="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <x-action-message
                        class="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-opacity duration-300"
                        on="company-updated">
                        <svg class="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        {{ __('Settings saved successfully') }}
                    </x-action-message>

                    <flux:button type="submit"
                        class="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transform hover:-translate-y-0.5 transition-all duration-300 border-none">
                        {{ __('Save Changes') }}
                    </flux:button>
                </div>
            </form>
        </div>
    </div>

    <style>
        @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    </style>
</div>
