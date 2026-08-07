<?php

namespace App\Livewire;

use App\Models\CompanySetting;
use Livewire\Attributes\On;
use Livewire\Component;


class CompanyName extends Component
{

    public $name = '';

    public function mount()
    {
        $companyData = CompanySetting::first();
        $this->name = $companyData->name;
    }


    public function render()
    {
        return <<<'HTML'
            <span class="text-sm md:text-base
                    text-blue-100/90
                    transition-all duration-200 ease-in-out
                    group-hover:text-blue-50
                    group-hover:translate-x-0.5
                    transform
                    hover:scale-[1.02]
                    motion-reduce:transform-none">
                {{ $name }}
            </span>
        HTML;
    }

    #[On('company-updated')]
    public function listenCompanyUpdated()
    {
        $this->name = CompanySetting::first()->name;
    }
}
