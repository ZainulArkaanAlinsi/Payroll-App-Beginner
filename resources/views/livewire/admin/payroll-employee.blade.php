<div>
    <x-page-heading :pageHeading="__('Payroll Employee')" :pageDesc="__('Manage your payrolls here.')" />

    <!-- Dashboard Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- ... dashboard metrics code remains the same ... -->
        <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold mb-4">Total Payroll</h3>
            <p class="text-2xl font-bold">{{ $totalPayroll }}</p>
        </div>
    </div>

    <!-- Employee Level Distribution Chart -->
    <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">Distribusi Level Karyawan</h3>
        <div class="chart-container" class="h-64">
            <canvas id="levelChart"></canvas>
        </div>
    </div>

    <!-- Payroll Management Section -->
    <div class="bg-white rounded-lg shadow">
        <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">Daftar Payroll</h3>
            <flux:button wire:click="openModal" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                Tambah Payroll
            </flux:button>
        </div>

        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <!-- ... table header remains the same ... -->
                <tbody class="bg-white divide-y divide-gray-200">
                    @forelse ($payrolls as $payroll)
                    <tr>
                        <!-- ... table cells remain the same ... -->
                        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div class="flex space-x-2">
                                @if($payroll->payroll_details_count > 0)
                                <a href="{{ route('admin.payroll_employee') }}"
                                    class="text-blue-600 hover:text-blue-900">
                                    Detail
                                </a>
                                @else
                                <flux:button wire:click="openGenerateModal({{ $payroll->id }})"
                                    class="text-indigo-600 hover:text-indigo-900">
                                    Generate
                                </flux:button>
                                @endif
                                <flux:button wire:click="openModal({{ $payroll->id }})"
                                    class="text-yellow-600 hover:text-yellow-900">
                                    Edit
                                </flux:button>
                                <flux:button wire:click="openDeleteModal({{ $payroll->id }})"
                                    class="text-red-600 hover:text-red-900">
                                    Hapus
                                </flux:button>
                            </div>
                        </td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">
                            Tidak ada data payroll
                        </td>
                    </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="p-4">
            {{ $payrolls->links() }}
        </div>
    </div>

    <!-- Payroll Modal -->
    <div>
        <flux:modal name="main-modal" max-width="2xl">
            <div class="p-6">
                @if($isEditing)
                <h2 class="text-lg font-medium text-gray-900 mb-4">Edit Payroll</h2>
                @else
                <h2 class="text-lg font-medium text-gray-900 mb-4">Buat Payroll Baru</h2>
                @endif

                <div class="space-y-4">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <flux:label for="periodStart" :value="__('Tanggal Mulai Periode')" />
                            <flux:input wire:model="periodStart" id="periodStart" type="date"
                                class="mt-1 block w-full" />
                            <flux:error :messages="$errors->get('periodStart')" class="mt-2" />
                        </div>

                        <div>
                            <flux:label for="periodEnd" :value="__('Tanggal Akhir Periode')" />
                            <flux:input wire:model="periodEnd" id="periodEnd" type="date" class="mt-1 block w-full" />
                            <flux:error :messages="$errors->get('periodEnd')" class="mt-2" />
                        </div>
                    </div>

                    <div>
                        <flux:label for="paymentDate" :value="__('Tanggal Pembayaran')" />
                        <flux:input wire:model="paymentDate" id="paymentDate" type="date" class="mt-1 block w-full" />
                        <flux:error :messages="$errors->get('paymentDate')" class="mt-2" />
                    </div>

                    <div>
                        <flux:label for="notes" :value="__('Catatan (Opsional)')" />
                        <flux:textarea wire:model="notes" id="notes" class="mt-1 block w-full" rows="3" />
                        <flux:error :messages="$errors->get('notes')" class="mt-2" />
                    </div>
                </div>

                <div class="mt-6 flex justify-end space-x-3">
                    <flux:button wire:click="closeModal" variant="secondary">
                        <x-slot name="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </x-slot>
                        Batal
                    </flux:button>

                    <flux:button wire:click="save" variant="primary">
                        <x-slot name="icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </x-slot>
                        @if($isEditing)
                        Update
                        @else
                        Simpan
                        @endif
                    </flux:button>
                </div>
            </div>
        </flux:modal>
    </div>

    <!-- Generate Modal -->
    <div>
        <flux:modal name="generate-modal" max-width="2xl">
            <div class="p-6">
                <h2 class="text-lg font-medium text-gray-900 mb-4">
                    Generate Payroll Details
                </h2>

                <div class="mb-4">
                    <p class="text-sm text-gray-600">
                        Periode: {{ \Carbon\Carbon::parse($periodStart)->format('d M Y') }} -
                        {{ \Carbon\Carbon::parse($periodEnd)->format('d M Y') }}
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Allowances Section -->
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">Tunjangan</h3>
                        <div class="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">
                            @foreach($allowances as $allowance)
                            <div class="flex items-start">
                                <div class="flex items-center h-5">
                                    <flux:input wire:model="selectedAllowances" id="allowance-{{ $allowance->id }}"
                                        value="{{ $allowance->id }}" type="checkbox"
                                        class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                </div>
                                <div class="ml-3 text-sm">
                                    <flux:label for="allowance-{{ $allowance->id }}" class="font-medium text-gray-700">
                                        {{ $allowance->name }}
                                    </flux:label>
                                    <p class="text-gray-500">
                                        {{ $allowance->rule === 'fixed'
                                        ? format_currency($allowance->amount)
                                        : $allowance->amount . '%' }}
                                    </p>
                                </div>
                            </div>
                            @endforeach
                        </div>
                    </div>


                    <!-- Deductions Section -->
                    <div>
                        <h3 class="font-medium text-gray-700 mb-2">Potongan</h3>
                        <div class="space-y-2 max-h-60 overflow-y-auto p-2 border rounded">
                            @foreach($deductions as $deduction)
                            <div class="flex items-start">
                                <div class="flex items-center h-5">
                                    <!-- FIXED: Added closing / -->
                                    <flux:input wire:model="selectedDeductions" id="deduction-{{ $deduction->id }}"
                                        value="{{ $deduction->id }}" type="checkbox"
                                        class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                                </div>
                                <div class="ml-3 text-sm">
                                    <flux:label for="deduction-{{ $deduction->id }}" class="font-medium text-gray-700">
                                        {{ $deduction->name }}
                                    </flux:label>
                                    <p class="text-gray-500">
                                        {{ format_currency($deduction->amount) }}
                                    </p>
                                </div>
                            </div>
                            @endforeach
                        </div>
                    </div>
                </div>


                <div class="mt-6 flex justify-end space-x-3">
                    <flux:button wire:click="$dispatch('close-modal', { name: 'generate-modal' })" variant="secondary">
                        Batal
                    </flux:button>
                    <flux:button wire:click="generate" variant="primary">
                        Generate
                    </flux:button>
                </div>
            </div>
        </flux:modal>
    </div>

    <!-- Delete Confirmation Modal -->
    <div>
        <flux:modal name="delete-modal">
            <div class="p-6">
                <h2 class="text-lg font-medium text-gray-900">
                    Apakah Anda yakin ingin menghapus payroll ini?
                </h2>

                <p class="mt-1 text-sm text-gray-600">
                    Semua data yang terkait dengan payroll ini akan dihapus secara permanen.
                </p>

                <div class="mt-6 flex justify-end space-x-3">
                    <flux:button wire:click="$dispatch('close-modal', { name: 'delete-modal' })" variant="secondary">
                        Batal
                    </flux:button>
                    <flux:button wire:click="delete" variant="danger">
                        Hapus
                    </flux:button>
                </div>
            </div>
        </flux:modal>
    </div>
</div>

@push('scripts')
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
    document.addEventListener('livewire:load', function() {
        const ctx = document.getElementById('levelChart').getContext('2d');

        const levels = @json(array_column($employeesByLevel, 'level'));
        const totals = @json(array_column($employeesByLevel, 'total'));
        const colors = [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(201, 203, 207, 0.7)'
        ];

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: levels,
                datasets: [{
                    data: totals,
                    backgroundColor: colors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} karyawan (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    });
</script>
@endpush
