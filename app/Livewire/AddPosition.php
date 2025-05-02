<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Department;
use App\Models\Position;

class AddPosition extends Component
{

    public $departments = [];
    public $name = "";
    public $description = "";
    public $selectedDepartment = "";

    public function mount()
    {
        $departmentDatas = Department::select('id', 'name')->get();
        $this->departments = $departmentDatas;
    }


    public function render()
    {
        return view('livewire.admin.add-position');
    }


    public function addPosition()
    {
        $validated = $this->validate([
            'name' => 'required|string|max:255|unique:positions,name',
            'description' => 'nullable|string|max:1000',
            'selectedDepartment' => 'required|exists:departments,id',
        ]);

        // dd($request->all());

        Position::create([
            'name' => $this->name,
            'description' => $this->description,
            'department_id' => $this->selectedDepartment,
        ]);
        $this->dispatch('added-position');
        $this->close();
    }

    public function close()
    {
        $this->reset(['name', 'description', 'selectedDepartment']);
        $this->modal('add-position')->close();
    }

    
}
