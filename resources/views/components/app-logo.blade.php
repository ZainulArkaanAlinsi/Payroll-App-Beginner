<div
    class="relative flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 shadow-md hover:shadow-lg transition-all duration-500 group overflow-hidden">
    <!-- Animated background elements -->
    <div class="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
        <div class="absolute -left-10 -top-10 w-20 h-20 rounded-full bg-blue-400 animate-[pulse_8s_infinite]"></div>
        <div class="absolute -right-5 -bottom-5 w-16 h-16 rounded-full bg-blue-300 animate-[pulse_12s_infinite]"></div>
    </div>

    <!-- Logo container with subtle animation -->
    <div
        class="relative z-10 flex size-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 shadow-inner group-hover:bg-white/15 transition-all duration-300">
        <x-app-logo-icon class="size-6 text-white group-hover:[animation:float_3s_ease-in-out_infinite]" />
    </div>

    <!-- Text content -->
    <div class="relative z-10 grid text-start">
        <span class="text-lg font-semibold text-white tracking-tight">{{ config('app.name') }}</span>
        <livewire:company-name />
    </div>

    <!-- Subtle hover effect -->
    <div class="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all duration-700"></div>
</div>

<!-- Add this to your Tailwind config or CSS -->
<style>
    @keyframes float {

        0%,
        100% {
            transform: translateY(0);
        }

        50% {
            transform: translateY(-5px);
        }
    }

    @keyframes pulse {

        0%,
        100% {
            transform: scale(1);
        }

        50% {
            transform: scale(1.1);
        }

    }
</style>
