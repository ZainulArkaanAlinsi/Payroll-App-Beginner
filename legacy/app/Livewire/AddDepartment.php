<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Department;


class AddDepartment extends Component
{

    public $name = '';
    public $description = '';

    public function render()
    {
        return view('livewire.admin.add-department');
    }

    public function addDepartment()
    {
        $validated = $this->validate([
            'name' => 'required|string|max:255|unique:departments,name',
            'description' => 'nullable|string|max:1000',
        ]);

        Department::create($validated);

        $this->dispatch('added');
        $this->close();
    }

    public function close()
    {
        $this->reset(['name', 'description']);
        $this->modal('add-department')->close();
    }
}
