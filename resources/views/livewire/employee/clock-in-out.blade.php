<div
    class="flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">

    {{-- Time and Date Now --}}
    <div class="flex flex-col gap-2">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {{ __('Current Time') }}
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ now()->format('l, F j, Y') }}
        </p>
        <p wire:poll.every.1000ms class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {{ now()->format('g:i:s A') }}
        </p>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
            {{ now()->timezone(config('app.timezone'))->format('e') }}
        </p>
    </div>
    {{-- Clock In/Out Status --}}
    <div class="flex flex-col gap-2">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {{ __('Attendance Status') }}
        </h3>
        <p class="text-sm text-neutral-500 dark:text-neutral-400">
            @if ($todayAttendance)
            @if ($todayAttendance->check_out)
            <span class="text-red-500">
                {{ __("You've Clocked Out Today") }}
            </span>
            @elseif ($todayAttendance->check_in)
            <span class="text-green-500">
                {{ __("You've Clocked In Today") }}
            </span>
            @endif
            @else
            <span class="text-gray-500">
                {{ __("You've not take any attendance today") }}
            </span>

            @endif
        </p>
    </div>

    {{-- Buttons --}}
    <div class="w-full flex gap-4">
        <flux:button wire:click="clockIn" class="w-full" icon="clock" type="button" variant="primary"
            wire:click="clockIn">
            {{ __('Clock In') }}
        </flux:button>
        <flux:button wire:click="clockOut" class="w-full" icon="clock" type="button" wire:click="clockOut">
            {{ __('Clock Out') }}
        </flux:button>
    </div>
</div>