<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Tax;
use Livewire\WithPagination;

class TaxSetting extends Component
{
    use WithPagination;

    public $name;
    public $description;
    public $rate;
    public $threshold;
    public $editId = null;
    public $search = '';

    protected $rules = [
        'name' => 'required|string|max:255|unique:taxes,name',
        'description' => 'nullable|string',
        'rate' => 'required|numeric|min:0|max:100',
        'threshold' => 'nullable|string|max:255',
    ];

    public function mount()
    {
        $this->resetInputFields();
    }

    public function resetInputFields()
    {
        $this->name = '';
        $this->description = '';
        $this->rate = '';
        $this->threshold = '';
        $this->editId = null;
    }

    public function saveTax()
    {
        $this->validate();

        Tax::create([
            'name' => $this->name,
            'description' => $this->description,
            'rate' => $this->rate,
            'threshold' => $this->threshold,
        ]);

        session()->flash('message', 'Tax rate created successfully.');
        $this->resetInputFields();
    }

    public function editTax($id)
    {
        $tax = Tax::findOrFail($id);
        $this->editId = $id;
        $this->name = $tax->name;
        $this->description = $tax->description;
        $this->rate = $tax->rate;
        $this->threshold = $tax->threshold;
    }

    public function updateTax()
    {
        $this->validate([
            'name' => 'required|string|max:255|unique:taxes,name,' . $this->editId,
            'description' => 'nullable|string',
            'rate' => 'required|numeric|min:0|max:100',
            'threshold' => 'nullable|string|max:255',
        ]);

        $tax = Tax::findOrFail($this->editId);
        $tax->update([
            'name' => $this->name,
            'description' => $this->description,
            'rate' => $this->rate,
            'threshold' => $this->threshold,
        ]);

        session()->flash('message', 'Tax rate updated successfully.');
        $this->resetInputFields();
    }

    public function deleteTax($id)
    {
        Tax::findOrFail($id)->delete();
        session()->flash('message', 'Tax rate deleted successfully.');
    }

    public function render()
    {
        $taxes = Tax::when($this->search, function ($query) {
            return $query->where('name', 'like', '%' . $this->search . '%')
                ->orWhere('description', 'like', '%' . $this->search . '%');
        })->orderBy('created_at', 'desc')->paginate(10);

        return view('livewire.admin.tax-setting', compact('taxes'));
    }
}
