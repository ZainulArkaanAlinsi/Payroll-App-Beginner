<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('salaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->decimal('amount', 15, 2); // Ganti 'month' menjadi 'base_salary'
            $table->string('pay_frequency')->default('monthly', 'weekly', 'daily'); // Ganti 'month' menjadi 'base_salary'
            $table->date('effective_date'); // Ganti typo 'efective_date' menjadi 'effective_date'
            $table->timestamps();
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salaries');
    }
};
