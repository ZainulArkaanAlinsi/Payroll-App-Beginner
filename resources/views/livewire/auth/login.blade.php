<?php

use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Livewire\Attributes\Layout;
use Livewire\Attributes\Validate;
use Livewire\Volt\Component;

new #[Layout('components.layouts.auth-modern')] class extends Component {
    #[Validate('required|string|email')]
    public string $email = '';

    #[Validate('required|string')]
    public string $password = '';

    public bool $remember = false;

    /**
     * Handle an incoming authentication request.
     */
    public function login(): void
    {
        $this->validate();

        $this->ensureIsNotRateLimited();

        if (! Auth::attempt(['email' => $this->email, 'password' => $this->password], $this->remember)) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
        Session::regenerate();

        $this->redirectIntended(default: route('dashboard', absolute: false), navigate: true);
    }

    /**
     * Ensure the authentication request is not rate limited.
     */
    protected function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout(request()));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => __('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the authentication rate limiting throttle key.
     */
    protected function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->email).'|'.request()->ip());
    }
}; ?>

<div class="w-full flex min-h-screen selection:bg-indigo-500/30">
    <!-- Left Panel: Enterprise Identity -->
    <div class="hidden lg:flex w-1/2 relative bg-zinc-950 items-center justify-center border-r border-zinc-900/50">
        <!-- Structural decoration -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#1e1b4b_0%,transparent_50%)] opacity-40"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
        
        <div class="max-w-md w-full px-8 animate-[fadeIn_0.7s_ease-out]">
            <div class="inline-flex items-center gap-3 mb-16 group cursor-default">
                <div class="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group-hover:scale-105 transition-transform duration-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-2xl font-black tracking-tighter text-white leading-none">PAYROLL<span class="text-indigo-500">PRO</span></span>
                    <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Enterprise Suite</span>
                </div>
            </div>

            <h1 class="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
                The Standard in <br/>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">Human Capital.</span>
            </h1>

            <p class="text-lg text-zinc-400 font-medium leading-relaxed mb-12">
                Empower your organization with a platform built for precision, security, and global scale.
            </p>

            <div class="grid grid-cols-2 gap-6">
                <div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                    <div class="text-indigo-500 font-black text-2xl mb-1">99.9%</div>
                    <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Accuracy Rate</div>
                </div>
                <div class="p-5 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                    <div class="text-indigo-500 font-black text-2xl mb-1">256-bit</div>
                    <div class="text-xs font-bold text-zinc-500 uppercase tracking-widest">Encryption</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Right Panel: Refined Login Portal -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-20 bg-zinc-950 relative overflow-hidden">
        <!-- Subtle mobile glow -->
        <div class="lg:hidden absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-600/5 rounded-full blur-[100px]"></div>

        <div class="w-full max-w-sm relative z-10 animate-[fadeIn_0.6s_ease-out_0.2s_both]">
            <div class="mb-10 text-center lg:text-left">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    System Online & Secure
                </div>
                <h2 class="text-3xl font-black text-white tracking-tighter mb-2">Secure Access</h2>
                <p class="text-zinc-500 font-medium text-sm italic">Enter your credentials to manage your workforce.</p>
            </div>

            <x-auth-session-status class="mb-6" :status="session('status')" />

            <form wire:submit="login" class="space-y-6">
                <!-- Email -->
                <div class="space-y-2 group">
                    <label for="email" class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">{{ __('Corporate ID') }}</label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-indigo-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                        </div>
                        <input wire:model="email" id="email" type="email" required autofocus placeholder="name@company.com" 
                            class="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-500 transition-all duration-300" />
                    </div>
                    @error('email') <span class="text-rose-500 text-[10px] font-black uppercase tracking-wider ml-1">{{ $message }}</span> @enderror
                </div>

                <!-- Password -->
                <div class="space-y-2 group">
                    <div class="flex items-center justify-between ml-1">
                        <label for="password" class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{{ __('Security Key') }}</label>
                        @if (Route::has('password.request'))
                            <a href="{{ route('password.request') }}" wire:navigate class="text-[10px] font-black text-indigo-500 hover:text-indigo-400 transition-colors uppercase tracking-widest">
                                {{ __('Reset?') }}
                            </a>
                        @endif
                    </div>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-600 group-focus-within:text-indigo-500 transition-colors">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        <input wire:model="password" id="password" type="password" required placeholder="••••••••" 
                            class="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-500 transition-all duration-300" />
                    </div>
                    @error('password') <span class="text-rose-500 text-[10px] font-black uppercase tracking-wider ml-1">{{ $message }}</span> @enderror
                </div>

                <!-- Session Preference -->
                <div class="flex items-center pt-2">
                    <label class="relative flex items-center cursor-pointer group">
                        <input wire:model="remember" type="checkbox" class="sr-only peer" />
                        <div class="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white transition-all"></div>
                        <span class="ml-3 text-xs font-bold text-zinc-500 group-hover:text-zinc-400 transition-colors select-none">Stay authorized</span>
                    </label>
                </div>

                <div class="pt-6">
                    <button type="submit" wire:loading.attr="disabled" class="relative w-full group overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait">
                        <span wire:loading.remove class="flex items-center justify-center gap-2">
                            Initialize Portal
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </span>
                        <span wire:loading class="flex items-center justify-center">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="ml-3 uppercase tracking-widest text-[10px]">Authorizing...</span>
                        </span>
                    </button>
                </div>
            </form>

            @if (Route::has('register'))
                <div class="mt-12 text-center">
                    <a href="{{ route('register') }}" wire:navigate class="text-[10px] font-black text-zinc-600 hover:text-indigo-400 transition-all uppercase tracking-[0.3em] py-2 px-4 border border-transparent hover:border-zinc-800 rounded-lg">
                        Create Enterprise ID
                    </a>
                </div>
            @endif
        </div>
    </div>

    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</div>
