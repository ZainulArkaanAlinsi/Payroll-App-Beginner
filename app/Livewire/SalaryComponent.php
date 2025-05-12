<?php

namespace App\Livewire;

use App\Models\Allowance;
use Livewire\Attributes\Title;
use Livewire\Component;
use Livewire\WithPagination;
use Masmerise\Toaster\Toaster;
use App\Models\Deduction;


class SalaryComponent extends Component
{
    use WithPagination;
    public $selectedId = '';
    public $name = '';
    public $description = '';
    public $amount = '';
    public $rule = '';
    public $isEditAllowance = false;
    public $isDeduction = false;



    #[Title('Salary Component')]
    public function render()
    {
        return view('livewire.admin.salary-component', [
            'allowances' => Allowance::latest()->paginate(6),
            'deductions' => Deduction::latest()->paginate(6),
        ]);
    }

    public function closeModal()
    {
        $this->reset();
    }

    public function addAllowance()
    {
        $validated = $this->validate([
            'name' => ['required', 'min:3', 'max:255', 'string', 'unique:allowances,name'],
            'description' => ['required', 'string', 'max:1000'],
            'amount' => ['required', 'numeric'],
            'rule' => ['required', 'in:fixed,percentage'],
        ]);

        $allowance = Allowance::create($validated);
        $this->dispatch('added-allowance');
        Toaster::success('Allowance added successfully');
        $this->closeModal();
        $this->modal('main-modal')->close();
    }



    public function editModalAllowance($allowanceId)
    {
        $allowance = Allowance::find($allowanceId);
        $this->selectedId = $allowance->id; //save the selected id
        $this->name = $allowance->name;
        $this->description = $allowance->description;
        $this->amount = $allowance->amount;
        $this->rule = $allowance->rule;
        $this->isEditAllowance = true;
        $this->modal('main-modal')->show();
    }

    public function updateAllowance()
    {
        $validated = $this->validate([
            'name' => ['required', 'min:3', 'max:255', 'string', 'unique:allowances,name,' . $this->selectedId],
            'description' => ['required', 'string', 'max:1000'],
            'amount' => ['required', 'numeric'],
            'rule' => ['required', 'in:fixed,percentage'],
        ]);

        $allowance = Allowance::find($this->selectedId);
        if ($allowance) {
            $allowance->update($validated);
            $this->dispatch('updated-allowance');
            Toaster::success('Allowance updated successfully');
            $this->closeModal();
            $this->modal('main-modal')->close();
        }
    }

    public function deleteModalAllowance($allowanceId, $allowanceName)
    {
        $this->selectedId = $allowanceId;
        $this->name = $allowanceName;
        $this->modal('delete-modal')->show();
    }



    public function deleteAllowance()
    {
        $allowance = Allowance::find($this->selectedId);
        $allowance->delete();
        Toaster::success('Allowance deleted successfully');
        $this->closeModal();
        $this->modal('delete-modal')->close();
        $this->resetPage();
    }








    public function addDeduction()
    {
        $validated = $this->validate([
            'name' => ['required', 'min:3', 'max:255', 'string', 'unique:deductions,name'],
            'description' => ['required', 'string', 'max:1000'],
            'amount' => ['required', 'numeric','gt:100'],
        ]);
        
        Deduction::create($validated);
        Toaster::success('Deduction added successfully');
        $this->closeModal();
        $this->modal('main-modal')->close();
        $this->resetPage(); 
    }
}
