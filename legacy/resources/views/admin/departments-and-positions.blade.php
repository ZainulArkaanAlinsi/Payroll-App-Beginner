<x-layouts.app :title="__('Departments and Positions')">
    <!-- Enhanced Animated Page Heading -->
    <div class="mb-8 animate-fade-in">
        <div class="flex items-center space-x-3">
            <div class="p-2 rounded-lg bg-indigo-100/70 dark:bg-indigo-900/30 backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none"
                    viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            </div>
            <div>
                <h1 class="text-2xl font-semibold text-slate-800 dark:text-slate-100 transition-colors duration-300">
                    {{ __('Departments and Positions') }}
                </h1>
                <p class="mt-2 text-slate-500 dark:text-slate-400 transition-colors duration-300">
                    {{ __('Manage your organizational structure') }}
                </p>
            </div>
        </div>
    </div>

    <!-- Enhanced Card with glass morphism effect -->
    <div
        class="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/70 dark:border-slate-700/50 overflow-hidden">
        <!-- Action buttons section with subtle gradient -->
        <div
            class="flex justify-center items-center p-4 bg-gradient-to-r from-indigo-50/50 to-blue-50/50 dark:from-slate-700/70 dark:to-slate-800/70 rounded-t-xl border-b border-slate-200/50 dark:border-slate-700/30">
            <div class="flex space-x-4">
                <livewire:add-department />
                <livewire:add-position>
            </div>
        </div>

        <!-- Enhanced Table -->
        <div class="overflow-x-auto p-4 bg-white dark:bg-slate-800/70">
            <livewire:departments-positions-table />
        </div>
    </div>

    <!-- Enhanced CSS -->
    <style>
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-8px);
            }

            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes enter {
            from {
                opacity: 0;
                transform: translateX(-12px);
            }

            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .animate-fade-in {
            animation: fadeIn 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .animate-enter {
            animation: enter 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        /* Smooth hover transitions */
        .transition-all {
            transition-property: all;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
            transition-duration: 150ms;
        }
    </style>
</x-layouts.app>
