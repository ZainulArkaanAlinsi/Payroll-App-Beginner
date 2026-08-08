<?php

use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('components.layouts.auth-modern')] class extends Component {
    public string $name = '';
    public string $email = '';
    public string $password = '';
    public string $password_confirmation = '';

    /**
     * Handle an incoming registration request.
     */
    public function register(): void
    {
        $validated = $this->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:' . User::class],
            'password' => ['required', 'string', 'confirmed', Rules\Password::defaults()],
        ]);

        $validated['password'] = Hash::make($validated['password']);

        event(new Registered(($user = User::create($validated))));

        Auth::login($user);

        $this->redirectIntended(route('dashboard', absolute: false), navigate: true);
    }
}; ?>

<div class="w-full flex min-h-screen selection:bg-teal-500/30">
    <!-- Left Panel: Enterprise Identity -->
    <div class="hidden lg:flex w-1/2 relative bg-zinc-950 items-center justify-center border-r border-zinc-900/50">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,#064e3b_0%,transparent_50%)] opacity-30"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none"></div>
        
        <div class="max-w-md w-full px-8 animate-[fadeIn_0.7s_ease-out]">
            <div class="inline-flex items-center gap-3 mb-16 group cursor-default">
                <div class="w-14 h-14 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-teal-600/20 group-hover:scale-105 transition-transform duration-500">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                </div>
                <div class="flex flex-col">
                    <span class="text-2xl font-black tracking-tighter text-white leading-none">PAYROLL<span class="text-teal-500">PRO</span></span>
                    <span class="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-1">Onboarding Module</span>
                </div>
            </div>

            <h1 class="text-5xl font-black text-white leading-[1.1] tracking-tight mb-8">
                Scale Your <br/>
                <span class="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-500">Global Team.</span>
            </h1>

            <p class="text-lg text-zinc-400 font-medium leading-relaxed mb-12">
                Join our ecosystem and transform how your organization handles human capital management.
            </p>

            <div class="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm">
                <p class="text-sm text-zinc-400 font-medium italic">"Implementing PayrollPro was the most strategic decision our HR department made this year."</p>
                <div class="flex items-center gap-3 mt-4">
                    <div class="w-8 h-8 rounded-full bg-zinc-800"></div>
                    <div>
                        <div class="text-xs font-black text-white uppercase tracking-wider">Marcus Chen</div>
                        <div class="text-[10px] font-bold text-zinc-500 uppercase">CTO, CloudScale</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Right Panel: Refined Register Portal -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-20 bg-zinc-950">
        <div class="w-full max-w-sm animate-[fadeIn_0.6s_ease-out_0.2s_both]">
            <div class="mb-10 text-center lg:text-left">
                <h2 class="text-3xl font-black text-white tracking-tighter mb-2">Create Account</h2>
                <p class="text-zinc-500 font-medium text-sm italic">Enter the details to initialize your workspace.</p>
            </div>

            <form wire:submit="register" class="space-y-5">
                <!-- Name -->
                <div class="space-y-2 group">
                    <label for="name" class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">{{ __('Legal Entity Name') }}</label>
                    <input wire:model="name" id="name" type="text" required placeholder="Full Name" 
                        class="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-teal-600/5 focus:border-teal-500 transition-all duration-300" />
                    @error('name') <span class="text-rose-500 text-[10px] font-black uppercase tracking-wider ml-1">{{ $message }}</span> @enderror
                </div>

                <!-- Email -->
                <div class="space-y-2 group">
                    <label for="email" class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">{{ __('Corporate Email') }}</label>
                    <input wire:model="email" id="email" type="email" required placeholder="name@company.com" 
                        class="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white placeholder-zinc-700 focus:outline-none focus:ring-4 focus:ring-teal-600/5 focus:border-teal-500 transition-all duration-300" />
                    @error('email') <span class="text-rose-500 text-[10px] font-black uppercase tracking-wider ml-1">{{ $message }}</span> @enderror
                </div>

                <!-- Password Group -->
                <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div class="space-y-2 group">
                        <label for="password" class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">{{ __('Password') }}</label>
                        <input wire:model="password" id="password" type="password" required 
                            class="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-teal-600/5 focus:border-teal-500 transition-all duration-300" />
                    </div>
                    <div class="space-y-2 group">
                        <label for="password_confirmation" class="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">{{ __('Verify') }}</label>
                        <input wire:model="password_confirmation" id="password_confirmation" type="password" required 
                            class="w-full px-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-white focus:outline-none focus:ring-4 focus:ring-teal-600/5 focus:border-teal-500 transition-all duration-300" />
                    </div>
                </div>
                @error('password') <span class="text-rose-500 text-[10px] font-black uppercase tracking-wider ml-1">{{ $message }}</span> @enderror

                <div class="pt-6">
                    <button type="submit" wire:loading.attr="disabled" class="relative w-full group overflow-hidden bg-teal-600 hover:bg-teal-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-teal-600/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-wait">
                        <span wire:loading.remove>Initialize Workspace</span>
                        <span wire:loading class="flex items-center justify-center">
                            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span class="ml-3 uppercase tracking-widest text-[10px]">Processing...</span>
                        </span>
                    </button>
                </div>
            </form>

            <div class="mt-10 text-center">
                <p class="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] inline">Already a member?</p>
                <a href="{{ route('login') }}" wire:navigate class="text-[10px] font-black text-white hover:text-teal-400 transition-all uppercase tracking-[0.2em] ml-2 underline underline-offset-4 decoration-teal-500/30">
                    Sign In
                </a>
            </div>
        </div>
    </div>

    <style>
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</div>
