// src/components/workflow/WorkflowTrigger.jsx
import { useState } from 'react';
import { Plus, X } from 'lucide-react';

const WorkflowTrigger = ({ triggers, onAdd, onRemove }) => {
  const [selectedTrigger, setSelectedTrigger] = useState('');
  const [selectedStage, setSelectedStage] = useState('');

  const triggerTypes = [
    { value: 'Application.created', label: 'Application Created' },
    { value: 'Application.updated', label: 'Application Updated' },
    { value: 'Stage.changed', label: 'Stage Changed', hasStage: true },
    { value: 'Candidate.created', label: 'Candidate Created' },
    { value: 'Match.found', label: 'Match Found' }
  ];

  const stages = [
    'Applied',
    'Screening',
    'Interview',
    'Offer',
    'Hired',
    'Rejected'
  ];

  const handleAdd = () => {
    if (!selectedTrigger) return;

    const trigger = triggerTypes.find(t => t.value === selectedTrigger);
    
    const newTrigger = {
      type: selectedTrigger,
      label: trigger.label
    };

    if (trigger.hasStage && selectedStage) {
      newTrigger.stage = selectedStage;
      newTrigger.label = `${trigger.label} → ${selectedStage}`;
    }

    onAdd(newTrigger);
    setSelectedTrigger('');
    setSelectedStage('');
  };

  return (
    <div className="space-y-3">
      {/* Existing Triggers */}
      {triggers.length > 0 && (
        <div className="space-y-2">
          {triggers.map((trigger, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-brand-50 border border-brand-200 rounded-lg px-4 py-2"
            >
              <span className="text-sm font-medium text-brand-800">
                {trigger.label}
              </span>
              <button
                onClick={() => onRemove(index)}
                className="text-brand-500 hover:text-brand-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Trigger */}
      <div className="flex gap-2">
        <select
          value={selectedTrigger}
          onChange={(e) => {
            setSelectedTrigger(e.target.value);
            setSelectedStage('');
          }}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">Select trigger...</option>
          {triggerTypes.map((trigger) => (
            <option key={trigger.value} value={trigger.value}>
              {trigger.label}
            </option>
          ))}
        </select>

        {selectedTrigger === 'Stage.changed' && (
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option value="">Select stage...</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={handleAdd}
          disabled={!selectedTrigger || (selectedTrigger === 'Stage.changed' && !selectedStage)}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:bg-stone-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>
    </div>
  );
};

export default WorkflowTrigger;