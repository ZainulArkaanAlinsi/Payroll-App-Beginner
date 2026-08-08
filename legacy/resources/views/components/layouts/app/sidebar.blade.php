<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">

<head>
    @include('partials.head')
</head>

<body class="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans antialiased text-zinc-900 dark:text-zinc-100">
    <div class="flex min-h-screen w-full">
        <!-- Sidebar: High-Fidelity Enterprise Navigation -->
        <flux:sidebar sticky stashable class="glass border-r-0 dark:bg-zinc-950/80 w-64 lg:w-72 shadow-2xl backdrop-blur-2xl">
            <flux:sidebar.toggle class="lg:hidden" icon="x-mark" />

            <div class="px-6 py-10">
                <a href="{{ route('dashboard') }}" class="flex items-center gap-4 group" wire:navigate>
                    <div class="relative">
                        <div class="absolute inset-0 bg-indigo-600 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div class="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 relative z-10 group-hover:rotate-[10deg] transition-transform duration-500">
                            <x-app-logo class="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-xl font-black tracking-tighter leading-none text-white uppercase italic">PAYROLL<span class="text-indigo-500">PRO</span></span>
                        <span class="text-[8px] font-black text-zinc-600 uppercase tracking-[0.4em] mt-1.5 ml-0.5">Global Enterprise</span>
                    </div>
                </a>
            </div>

            <flux:navlist variant="outline" class="px-3 space-y-1">
                <flux:navlist.group :heading="__('CORE MODULES')" class="px-3 pb-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    <flux:navlist.item icon="home" :href="route('dashboard')" :current="request()->routeIs('dashboard')"
                        class="rounded-xl transition-all font-black text-xs h-11 hover:bg-white/5 {{ request()->routeIs('dashboard') ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' : 'text-zinc-400' }}"
                        wire:navigate>{{ __('Command Center') }}</flux:navlist.item>

                    @if (Auth::user()->role == 'admin')
                    <flux:navlist.item icon="user-group" :href="route('admin.employee-management')"
                        :current="request()->routeIS('admin.employee-management')"
                        class="rounded-xl transition-all font-black text-xs h-11 hover:bg-white/5 {{ request()->routeIS('admin.employee-management') ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' : 'text-zinc-400' }}"
                        wire:navigate>{{ __('Human Capital') }}</flux:navlist.item>

                    <flux:navlist.item icon="circle-stack" :href="route('admin.payroll-employee')"
                        :current="request()->routeIS('admin.payroll-employee')"
                        class="rounded-xl transition-all font-black text-xs h-11 hover:bg-white/5 {{ request()->routeIS('admin.payroll-employee') ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' : 'text-zinc-400' }}"
                        wire:navigate>{{ __('Treasury & Pay') }}</flux:navlist.item>

                    <flux:navlist.item icon="calendar-date-range" :href="route('admin.leave-requests-admin')" 
                        :current="request()->routeIs('admin.leave-requests-admin')" 
                        class="rounded-xl transition-all font-black text-xs h-11 hover:bg-white/5 {{ request()->routeIs('admin.leave-requests-admin') ? 'bg-indigo-600/10 text-indigo-400 ring-1 ring-indigo-500/20' : 'text-zinc-400' }}"
                        wire:navigate>{{ __('Time Tracking') }}</flux:navlist.item>
                    @endif
                </flux:navlist.group>

                @if (Auth::user()->role == 'admin')
                <flux:navlist.group :heading="__('ADMINISTRATION')" class="px-3 pt-8 pb-4 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em]">
                    <flux:navlist.item icon="cog-6-tooth" :href="route('admin.company-settings')"
                        :current="request()->routeIS('admin.company-settings')"
                        class="rounded-xl transition-all font-black text-xs h-11 hover:bg-white/5 text-zinc-400"
                        wire:navigate>{{ __('System Tuning') }}</flux:navlist.item>

                    <flux:navlist.item icon="building-library" :href="route('admin.departments-and-positions')"
                        :current="request()->routeIS('admin.departments-and-positions')"
                        class="rounded-xl transition-all font-black text-xs h-11 hover:bg-white/5 text-zinc-400"
                        wire:navigate>{{ __('Unit Control') }}</flux:navlist.item>
                </flux:navlist.group>
                @endif
            </flux:navlist>

            <flux:spacer />

            <!-- User Context: Ultra-Clean -->
            <div class="px-4 py-8 mt-auto">
                <flux:dropdown position="top" align="start" class="w-full">
                    <div class="p-3 bg-zinc-900/50 hover:bg-zinc-900 rounded-2xl flex items-center gap-4 transition-all cursor-pointer group border border-white/5 shadow-inner">
                        <div class="relative">
                            <span class="flex h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-indigo-600/20 border border-indigo-500/30">
                                <span class="flex h-full w-full items-center justify-center text-indigo-400 font-black text-sm">
                                    {{ auth()->user()->initials() }}
                                </span>
                            </span>
                            <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-[3px] border-zinc-950 rounded-full shadow-lg"></div>
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-[11px] font-black text-white truncate uppercase tracking-tighter">{{ auth()->user()->name }}</p>
                            <p class="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mt-0.5">{{ auth()->user()->role }}</p>
                        </div>
                        <flux:icon.chevrons-up-down class="w-4 h-4 text-zinc-700 group-hover:text-indigo-500 transition-colors" />
                    </div>

                    <flux:menu class="w-[240px] glass rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 p-2 overflow-hidden">
                        <div class="px-4 py-3 mb-2 bg-white/5 rounded-xl">
                            <p class="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Account</p>
                            <p class="text-xs font-bold text-zinc-200 truncate">{{ auth()->user()->email }}</p>
                        </div>
                        <flux:menu.item :href="route('settings.profile')" icon="user-circle" wire:navigate class="rounded-xl text-xs font-black">{{ __('Security Profile') }}</flux:menu.item>
                        <flux:menu.item :href="route('settings.profile')" icon="cog" wire:navigate class="rounded-xl text-xs font-black">{{ __('Preferences') }}</flux:menu.item>
                        
                        <flux:menu.separator class="my-2 bg-zinc-800" />

                        <form method="POST" action="{{ route('logout') }}" class="w-full">
                            @csrf
                            <flux:menu.item as="button" type="submit" icon="arrow-right-start-on-rectangle" class="w-full rounded-xl text-xs font-black text-rose-500 hover:bg-rose-500/10 transition-colors">
                                {{ __('Terminate Session') }}
                            </flux:menu.item>
                        </form>
                    </flux:menu>
                </flux:dropdown>
            </div>
        </flux:sidebar>

        <div class="flex-1 flex flex-col min-w-0">
            <!-- Mobile Header: Glassmorphism -->
            <flux:header class="lg:hidden glass border-b-0 backdrop-blur-xl bg-zinc-950/50 h-16">
                <flux:sidebar.toggle class="lg:hidden" icon="bars-2" inset="left" />
                <flux:spacer />
                <flux:dropdown position="top" align="end">
                    <flux:profile :initials="auth()->user()->initials()" class="rounded-xl shadow-lg ring-2 ring-indigo-500/20" />
                    <flux:menu class="glass rounded-2xl border border-white/5 shadow-2xl">
                        <flux:menu.item :href="route('settings.profile')" icon="cog" wire:navigate class="font-black text-xs">{{ __('Settings') }}</flux:menu.item>
                        <flux:menu.separator class="bg-zinc-800" />
                        <form method="POST" action="{{ route('logout') }}" class="w-full">
                            @csrf
                            <flux:menu.item as="button" type="submit" icon="arrow-right-start-on-rectangle" class="w-full text-rose-500 font-black text-xs">
                                {{ __('Log Out') }}
                            </flux:menu.item>
                        </form>
                    </flux:menu>
                </flux:dropdown>
            </flux:header>

            <main class="flex-1 overflow-x-hidden">
                {{ $slot }}
            </main>
        </div>
    </div>

    <x-toaster-hub />
    @fluxScripts
</body>

</html>