<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PayrollPro | Authentication</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    @include('partials.head')
    <style>
        body {
            font-family: 'Outfit', sans-serif;
        }
        .pro-background {
            background-color: #020617;
            background-image: radial-gradient(at 0% 0%, hsla(225,39%,10%,1) 0, transparent 50%);
        }
    </style>
</head>
<body class="min-h-screen pro-background antialiased selection:bg-indigo-500/30">

    <div class="relative min-h-screen flex items-center justify-center overflow-hidden">
        {{ $slot }}
    </div>
    @fluxScripts
</body>
</html>

