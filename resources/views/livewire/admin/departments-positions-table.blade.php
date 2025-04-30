<div>
    <table class="min-w-full divide-y divide-slate-200/50 dark:divide-slate-700/30">
        <thead class="bg-slate-50/70 dark:bg-slate-800/70 backdrop-blur-sm">
            <tr>
                <th
                    class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300 group">
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {{ __('Department') }}
                        </span>
                    </div>
                </th>
                <th
                    class="px-6 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300 group">
                    <div class="flex items-center space-x-2">
                        <svg xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 transition-colors"
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {{ __('Position') }}
                        </span>
                    </div>
                </th>
                <th
                    class="px-6 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider transition-colors duration-300">
                    {{ __('Actions') }}
                </th>
            </tr>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end space-x-2">
                    <x-button variant="primary" size="sm" icon="pencil" type="button"
                        class="text-indigo-600 hover:bg-indigo-50/70 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-all duration-200 hover:scale-105">
                        {{ __('Edit') }}
                    </x-button>
                    <x-button variant="primary" size="sm" icon="trash" type="button"
                        class="text-rose-600 hover:bg-rose-50/70 dark:text-rose-400 dark:hover:bg-rose-900/20 transition-all duration-200 hover:scale-105">
                        {{ __('Delete') }}
                    </x-button>
                </div>
            </td>
        </thead>
    </table>
</div>
