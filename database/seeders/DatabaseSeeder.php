<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\CompanySetting;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
    User::factory()->create([
        'name' => 'Admin Zainaril',
        'email' => 'arkaan@admin.com',
        'password' => bcrypt('1234567890'),
        'role' => 'admin',
    ]);

    CompanySetting::factory()->create([
        'name' => 'PT CKR',
        'description' => 'Membangun semua bidang usaha yang ada di dunia ini',
        'address' => 'Jl. Raya No. 1 Jakarta Pusat Indonesia 12345 ',
        'phone' => '+62 123 4567 890',
        'value' => 'Berani Berubah untuk Maju Bersama',

    ]);

    }
}
