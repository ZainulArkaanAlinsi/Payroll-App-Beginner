<x-layouts.app :title="__('Dashboard')">
    <div class="flex h-full w-full flex-1 flex-col gap-6 p-4">
        <!-- Grid 3 kolom (tetap menggunakan placeholder pattern) -->
        <div class="grid auto-rows-min gap-6 md:grid-cols-3">
            <div class="relative aspect-video overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-800">
                <x-placeholder-pattern
                    class="absolute inset-0 size-full stroke-gray-900/10 dark:stroke-neutral-100/10" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                    <span class="text-sm font-medium text-gray-400 dark:text-neutral-500">Card 1</span>
                </div>
            </div>
            <div class="relative aspect-video overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-800">
                <x-placeholder-pattern
                    class="absolute inset-0 size-full stroke-gray-900/10 dark:stroke-neutral-100/10" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                    <span class="text-sm font-medium text-gray-400 dark:text-neutral-500">Card 2</span>
                </div>
            </div>
            <div class="relative aspect-video overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-800">
                <x-placeholder-pattern
                    class="absolute inset-0 size-full stroke-gray-900/10 dark:stroke-neutral-100/10" />
                <div class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                    <span class="text-sm font-medium text-gray-400 dark:text-neutral-500">Card 3</span>
                </div>
            </div>
        </div>

        <!-- Area utama (tetap menggunakan placeholder pattern) -->
        <div class="relative flex-1 overflow-hidden rounded-xl bg-white shadow-sm dark:bg-neutral-800">
            <x-placeholder-pattern class="absolute inset-0 size-full stroke-gray-900/10 dark:stroke-neutral-100/10" />
            <div class="absolute inset-0 flex items-center justify-center bg-black/5 dark:bg-white/5">
                <span class="text-sm font-medium text-gray-400 dark:text-neutral-500">Main Content</span>
            </div>
        </div>
    </div>
</x-layouts.app>
