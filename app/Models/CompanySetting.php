<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    use HasFactory;
    protected $guarded = [];
    
   public function render()
   {
      return view('livewire.admin.company.setting');
   }
}
