<x-layouts.app :title="__('Dashboard')">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <!-- Left Column -->
        <div class="lg:col-span-1 space-y-6">
            <!-- Skillset Card -->
            <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                <h2 class="text-lg font-semibold mb-4">Skillset</h2>
                <ul class="space-y-3">
                    <li class="flex items-center">
                        <input type="checkbox" class="mr-3 rounded border-gray-300">
                        <span>Dashboard</span>
                    </li>
                    <li class="flex items-center">
                        <input type="checkbox" checked class="mr-3 rounded border-gray-300">
                        <span class="font-medium">Mentors</span>
                    </li>
                    <li class="flex items-center">
                        <input type="checkbox" class="mr-3 rounded border-gray-300">
                        <span>Students</span>
                    </li>
                    <li class="flex items-center">
                        <input type="checkbox" class="mr-3 rounded border-gray-300">
                        <span>Analytics</span>
                    </li>
                    <li class="flex items-center">
                        <input type="checkbox" class="mr-3 rounded border-gray-300">
                        <span>Courses</span>
                    </li>
                    <li class="flex items-center">
                        <input type="checkbox" class="mr-3 rounded border-gray-300">
                        <span>Forum</span>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Right Column -->
        <div class="lg:col-span-3 space-y-6">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Total Revenue -->
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <h3 class="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Revenue</h3>
                    <p class="text-2xl font-bold">{{ '$' . number_format($totalRevenue, 2) }}</p>
                    <p class="text-green-500 text-sm mt-1">↑ 2% from last month</p>
                </div>

                <!-- Active Users -->
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <h3 class="text-gray-500 dark:text-gray-400 text-sm mb-1">Active Users</h3>
                    <p class="text-2xl font-bold">16,815</p>
                    <p class="text-green-500 text-sm mt-1">↑ 1.7% from last month</p>
                </div>

                <!-- New Users -->
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <h3 class="text-gray-500 dark:text-gray-400 text-sm mb-1">New Users</h3>
                    <p class="text-2xl font-bold">1,457</p>
                    <p class="text-green-500 text-sm mt-1">↑ 2.9% from last month</p>
                </div>
            </div>

            <!-- Tables Section -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Tutor Table -->
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <h3 class="font-semibold mb-3">Tutor</h3>
                    <ul class="space-y-2">
                        <li>Wed</li>
                        <li>Thu</li>
                        <li>Fri</li>
                        <li>Sat</li>
                    </ul>
                </div>

                <!-- Time Table -->
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <h3 class="font-semibold mb-3">Time</h3>
                    <ul class="space-y-2">
                        <li>17</li>
                        <li>18</li>
                        <li>19</li>
                        <li>20</li>
                        <li>21</li>
                    </ul>
                </div>

                <!-- Community Growth -->
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                    <h3 class="font-semibold mb-3">Community growth</h3>
                    <p class="text-green-500">0.93% from last month</p>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div class="bg-green-500 h-2 rounded-full"></div>
                    </div>
                    <p class="text-right text-sm mt-1">65%</p>
                </div>
            </div>

            <!-- Date Filter -->
            <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800">
                <div class="flex items-center">
                    <input type="checkbox" class="mr-3 rounded border-gray-300">
                    <span>1 Sep 2024 - 31 Sep 2024</span>
                </div>
            </div>

            <!-- Course Purchases Table -->
            <div class="rounded-xl border dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden">
                <div class="p-6">
                    <h2 class="text-lg font-semibold mb-4">Course Purchases</h2>
                </div>
                <table class="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                    <thead class="bg-gray-50 dark:bg-neutral-700">
                        <tr>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Course Name</th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Student Name</th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Student ID</th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Amount</th>
                            <th
                                class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                        <tr>
                            <td class="px-6 py-4 font-semibold">Digital Marketing</td>
                            <td class="px-6 py-4 font-semibold">Arfa</td>
                            <td class="px-6 py-4 font-semibold">#3456791</td>
                            <td class="px-6 py-4 font-semibold">$ 372.00</td>
                            <td class="px-6 py-4 font-semibold">Rafa</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Bottom Links -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-center">
                    <p class="font-semibold">Settings</p>
                </div>
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-center">
                    <p class="font-semibold">Help Center</p>
                </div>
                <div class="rounded-xl border p-6 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-center">
                    <p class="font-semibold">Log out</p>
                </div>
            </div>
        </div>
    </div>
</x-layouts.app>