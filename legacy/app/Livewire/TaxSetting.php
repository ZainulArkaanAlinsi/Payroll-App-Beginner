<?php

namespace App\Livewire;

use Livewire\Component;
use App\Models\Tax;
use Livewire\WithPagination;

class TaxSetting extends Component
{
    use WithPagination;

    public $showTaxModal = false;
    public $confirmingDelete = null;
    public $name;
    public $description;
    public $rate;
    public $threshold;
    public $editId = null;
    public $search = '';


    protected function rules()
    {
        return [
            'name' => 'required|string|max:255|unique:taxes,name,' . $this->editId,
            'description' => 'nullable|string',
            'rate' => 'required|numeric|min:0|max:100',
            'threshold' => 'nullable|string|max:255',
        ];
    }

    public function openTaxModal()
    {
        $this->resetForm();
        $this->showTaxModal = true;
    }

    public function closeModal()
    {
        $this->showTaxModal = false;
        $this->resetForm();
    }

    public function resetForm()
    {
        $this->resetErrorBag();
        $this->reset(['name', 'description', 'rate', 'threshold', 'editId']);
    }

    public function saveTax()
    {
        $this->validate();

        if ($this->editId) {
            Tax::findOrFail($this->editId)->update($this->getData());
            $message = 'Tax rate updated successfully';
        } else {
            Tax::create($this->getData());
            $message = 'Tax rate created successfully';
        }

        $this->closeModal();
        session()->flash('message', $message);
    }

    private function getData()
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'rate' => $this->rate,
            'threshold' => $this->threshold,
        ];
    }

    public function editTax($id)
    {
        $tax = Tax::findOrFail($id);
        $this->editId = $id;
        $this->name = $tax->name;
        $this->description = $tax->description;
        $this->rate = $tax->rate;
        $this->threshold = $tax->threshold;
        $this->showTaxModal = true;
    }

    public function confirmDelete($id)
    {
        $this->confirmingDelete = $id;
    }

    public function deleteTax($id)
    {
        Tax::findOrFail($id)->delete();
        $this->confirmingDelete = null;
        session()->flash('message', 'Tax rate deleted successfully');
    }
    public function render()
    {
        $taxes = Tax::query()
            ->when($this->search, fn($q) => $q->where('name', 'like', '%' . $this->search . '%'))
            ->orderBy('name')
            ->paginate(10);

        return view('livewire.admin.tax-setting', [
            'taxes' => $taxes,
        ]);
    }
}
