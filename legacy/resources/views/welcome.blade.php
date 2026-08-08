<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PayrollPro | The Future of Workforce Management</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    <style>
        body { font-family: 'Outfit', sans-serif; }
        
        .hero-gradient {
            background: radial-gradient(circle at 0% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                        radial-gradient(circle at 100% 100%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
        }

        .float { animation: float 6s ease-in-out infinite; }
        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
        }

        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .reveal.active {
            opacity: 1;
            transform: translateY(0);
        }
    </style>
</head>
<body class="antialiased text-zinc-100 bg-zinc-950 hero-gradient min-h-screen selection:bg-indigo-500/30">
    
    <!-- Navigation -->
    <nav class="fixed top-0 w-full z-50 glass border-b-0 py-4 px-6">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <div class="flex items-center gap-3 group cursor-pointer" onclick="window.location.href='/'">
                <div class="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <span class="text-2xl font-black tracking-tighter">PAYROLL<span class="text-indigo-500">PRO</span></span>
            </div>
            
            <div class="hidden md:flex items-center gap-8">
                <a href="#features" class="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Features</a>
                <a href="#" class="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Pricing</a>
                <a href="#" class="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Enterprise</a>
            </div>

            <div class="flex items-center gap-4">
                @if (Route::has('login'))
                    @auth
                        <a href="{{ url('/dashboard') }}" class="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold transition-all">Go to App</a>
                    @else
                        <a href="{{ route('login') }}" class="text-sm font-bold text-zinc-400 hover:text-white transition-colors">Sign In</a>
                        @if (Route::has('register'))
                            <a href="{{ route('register') }}" class="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transform hover:-translate-y-0.5 transition-all">Get Started</a>
                        @endif
                    @endauth
                @endif
            </div>
        </div>
    </nav>

    <main class="pt-32 pb-20 px-6">
        <!-- Hero Section -->
        <section class="max-w-7xl mx-auto text-center mb-32">
            <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-widest mb-8 animate-bounce">
                <span class="w-2 h-2 rounded-full bg-indigo-400"></span>
                Now Powered by AI
            </div>
            <h1 class="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
                Workforce Management <br/>
                <span class="text-gradient">Redefined.</span>
            </h1>
            <p class="text-xl text-zinc-400 max-w-3xl mx-auto leading-relaxed mb-12 font-medium">
                The all-in-one payroll and employee engagement platform designed for modern teams. Automate compliance, streamline payments, and empower your workforce.
            </p>
            <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                <a href="{{ route('register') }}" class="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-lg shadow-2xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300">
                    Start Free Trial
                </a>
                <a href="#features" class="w-full sm:w-auto px-10 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-lg transition-all">
                    Watch Demo
                </a>
            </div>

            <!-- Hero Image / Mockup -->
            <div class="relative max-w-6xl mx-auto">
                <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-20"></div>
                <div class="relative glass rounded-[2.5rem] p-4 overflow-hidden shadow-2xl border-indigo-500/10">
                    <div class="bg-zinc-950/50 rounded-[1.5rem] overflow-hidden border border-white/5">
                        <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop" alt="Dashboard Preview" class="w-full opacity-90 hover:scale-105 transition-transform duration-1000">
                    </div>
                </div>
                <!-- Floating Elements -->
                <div class="absolute -top-10 -right-10 glass p-6 rounded-3xl float shadow-2xl hidden lg:block">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <div>
                            <p class="text-xs font-black text-zinc-500 uppercase tracking-widest">Payroll Status</p>
                            <p class="text-lg font-black">Completed</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 mb-32">
            <div class="reveal p-10 glass rounded-[2.5rem] hover:bg-white/5 transition-all duration-500 border-0">
                <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-8">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
                <h3 class="text-2xl font-black mb-4">Unified HR Core</h3>
                <p class="text-zinc-400 font-medium leading-relaxed">Centralize your team's data with advanced role-based access and organizational hierarchy management.</p>
            </div>

            <div class="reveal p-10 glass rounded-[2.5rem] hover:bg-white/5 transition-all duration-500 border-0" style="transition-delay: 200ms">
                <div class="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-purple-500/20 mb-8">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-2xl font-black mb-4">Smart Attendance</h3>
                <p class="text-zinc-400 font-medium leading-relaxed">AI-driven attendance tracking with geolocation and automated leave management workflows.</p>
            </div>

            <div class="reveal p-10 glass rounded-[2.5rem] hover:bg-white/5 transition-all duration-500 border-0" style="transition-delay: 400ms">
                <div class="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 mb-8">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"></path></svg>
                </div>
                <h3 class="text-2xl font-black mb-4">Precision Payroll</h3>
                <p class="text-zinc-400 font-medium leading-relaxed">Automated salary processing with real-time tax calculations and instant payslip generation.</p>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="max-w-5xl mx-auto reveal glass rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div class="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl"></div>
            <div class="relative z-10">
                <h2 class="text-4xl md:text-5xl font-black mb-8 leading-tight">Ready to transform your <br/> company's operations?</h2>
                <p class="text-lg text-zinc-400 mb-12 max-w-2xl mx-auto font-medium">Join 500+ enterprises who trust PayrollPro for their workforce management needs.</p>
                <a href="{{ route('register') }}" class="inline-flex items-center gap-3 px-12 py-5 rounded-2xl bg-white text-zinc-950 font-black text-xl hover:scale-105 transition-all duration-300">
                    Get Started Now
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
            </div>
        </section>
    </main>

    <footer class="py-12 border-t border-white/5 text-center text-zinc-500 font-bold text-sm uppercase tracking-widest">
        <p>&copy; {{ date('Y') }} PayrollPro Enterprise. Crafted for Excellence.</p>
    </footer>

    <script>
        // Reveal animation on scroll
        function reveal() {
            var reveals = document.querySelectorAll(".reveal");
            for (var i = 0; i < reveals.length; i++) {
                var windowHeight = window.innerHeight;
                var elementTop = reveals[i].getBoundingClientRect().top;
                var elementVisible = 150;
                if (elementTop < windowHeight - elementVisible) {
                    reveals[i].classList.add("active");
                }
            }
        }
        window.addEventListener("scroll", reveal);
        // Initial check
        reveal();
    </script>
</body>
</html>

