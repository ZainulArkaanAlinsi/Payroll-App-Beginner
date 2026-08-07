<?php

namespace App\Livewire;

use App\Models\CompanySetting as ModelCompanySetting;
use Livewire\Attributes\Title;
use Livewire\Component;


class CompanySetting extends Component
{


    public $id = '';
    public $name = '';
    public $description = '';
    public $address = '';
    public $phone = '';
    public $value = '';

    public function mount()
    {
        $companyData = ModelCompanySetting::first();
        $this->id = $companyData->id;
        $this->name = $companyData->name;
        $this->description = $companyData->description;
        $this->address = $companyData->address;
        $this->phone = $companyData->phone;
        $this->value = $companyData->value;
    }

     #[Title('Company Setting')]

    public function render()
    {

        return view('livewire.admin.company-setting');
    }

    public function updateCompany()
    {
        $this->validate([
            'name' => 'required|min:3|max:255',
            'description' => 'required|string',
            'address' => 'required|string|min:3|max:255',
            'phone' => 'required|string|min:8',
            'value' => 'required|string|min:3|max:255',
        ]);



        ModelCompanySetting::updateOrCreate([
            'id' => $this->id,
        ], [
            'name' => $this->name,
            'description' => $this->description,
            'address' => $this->address,
            'phone' => $this->phone,
            'value' => $this->value,
        ]);

        $this->dispatch('company-updated');
    }
}
