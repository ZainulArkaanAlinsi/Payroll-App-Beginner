<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Position;

class DepartmentsPositionsTable extends Component
{

    public $positions = [];


    public function mount()
    {
        $positionDataWithDepartment = Position::with('department')->get();
        $this->positions = $positionDataWithDepartment;
    }

    public function render()
    {
        return view('livewire.admim.departments-positions-table');
    }


}

