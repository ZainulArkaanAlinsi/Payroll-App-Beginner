<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Position;
use Livewire\Attributes\On;


class DepartmentsPositionsTable extends Component
{

    public $positions = [];
    public $selectedPositionId = "";


    public function mount()
    {
       $this->getDataTable();
    }

    public function render()
    {
        return view('livewire.admin.departments-positions-table');
    }


    #[On('added-position')]
    public function getDataTable()
    {
        $positionDataWithDepartment = Position::with('department')->latest()->get();
        $this->positions = $positionDataWithDepartment;
    }

    public function updated()
    {
        
    }
    public function deletePosition($positionId)
    {
        $position = Position::find($positionId);
        if ($position) {
            $position->delete();
            $this->dispatch('deleted-position');
            $this->modal('delete-position')->close();
        }
    }

}

