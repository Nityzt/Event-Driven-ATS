// src/components/workflow/WorkflowBuilder.jsx
import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Eye, X } from 'lucide-react';
import WorkflowStep from './WorkflowStep';
import WorkflowTrigger from './WorkflowTrigger';
import StepPalette from './StepPalette';
import apiClient from '../../api/client';
import { workflowsAPI } from '../../api';

const WorkflowBuilder = ({ existingWorkflow = null, onSave = null, onCancel = null }) => {
  const [workflow, setWorkflow] = useState(existingWorkflow || {
    name: '',
    triggers: [],
    steps: [],
    enabled: true
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setWorkflow((prev) => {
        const oldIndex = prev.steps.findIndex((s) => s.id === active.id);
        const newIndex = prev.steps.findIndex((s) => s.id === over.id);
        return {
          ...prev,
          steps: arrayMove(prev.steps, oldIndex, newIndex)
        };
      });
    }
  };

  const addStep = (stepType) => {
    const newStep = {
      id: `step_${Date.now()}`,
      type: stepType,
      config: getDefaultConfig(stepType)
    };

    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const updateStep = (stepId, updates) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((step) =>
        step.id === stepId ? { ...step, ...updates } : step
      )
    }));
  };

  const deleteStep = (stepId) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.filter((step) => step.id !== stepId)
    }));
  };

  const addTrigger = (trigger) => {
    setWorkflow((prev) => ({
      ...prev,
      triggers: [...prev.triggers, trigger]
    }));
  };

  const removeTrigger = (index) => {
    setWorkflow((prev) => ({
      ...prev,
      triggers: prev.triggers.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!workflow.name || workflow.name.trim() === '') {
      newErrors.name = 'Workflow name is required';
    }

    if (workflow.triggers.length === 0) {
      newErrors.triggers = 'At least one trigger is required';
    }

    if (workflow.steps.length === 0) {
      newErrors.steps = 'At least one step is required';
    }

    // Validate each step
    workflow.steps.forEach((step, index) => {
      if (step.type === 'sendEmail' || step.type === 'sendSMS') {
        if (!step.config.message || step.config.message.trim() === '') {
          newErrors[`step_${index}`] = 'Message is required';
        }
      }

      if (step.type === 'wait') {
        if (!step.config.duration || step.config.duration <= 0) {
          newErrors[`step_${index}`] = 'Duration must be greater than 0';
        }
      }

      if (step.type === 'webhook') {
        if (!step.config.url || !isValidUrl(step.config.url)) {
          newErrors[`step_${index}`] = 'Valid webhook URL is required';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!workflow.steps.length) {
      alert('Add at least one step to preview.');
      return;
    }
    setPreviewing(true);
    try {
      const response = await workflowsAPI.preview(workflow);
      setPreviewData(response.data?.data?.resolvedSteps || []);
    } catch (err) {
      alert(`Preview failed: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const endpoint = existingWorkflow ? `/workflows/${existingWorkflow._id}` : '/workflows';
      const method = existingWorkflow ? 'put' : 'post';

      await apiClient[method](endpoint, workflow);

      if (onSave) {
        onSave();
      }
    } catch (error) {
      alert(`Failed to save workflow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-6">Workflow Builder</h1>

        {/* Workflow Name */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Workflow Name
          </label>
          <input
            type="text"
            value={workflow.name}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="e.g., Candidate Onboarding Flow"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        {/* Triggers */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Triggers</h2>
          <WorkflowTrigger
            triggers={workflow.triggers}
            onAdd={addTrigger}
            onRemove={removeTrigger}
          />
          {errors.triggers && <p className="text-red-500 text-sm mt-1">{errors.triggers}</p>}
        </div>

        {/* Steps */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Steps</h2>
          
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={workflow.steps.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {workflow.steps.map((step, index) => (
                  <WorkflowStep
                    key={step.id}
                    step={step}
                    index={index}
                    onUpdate={updateStep}
                    onDelete={deleteStep}
                    error={errors[`step_${index}`]}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {workflow.steps.length === 0 && (
            <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500">No steps added yet. Use the palette below to add steps.</p>
            </div>
          )}
          {errors.steps && <p className="text-red-500 text-sm mt-1">{errors.steps}</p>}
        </div>

        {/* Step Palette */}
        <StepPalette onAddStep={addStep} />

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <label className="flex items-center gap-2 mr-auto">
            <input
              type="checkbox"
              checked={workflow.enabled}
              onChange={(e) => setWorkflow({ ...workflow, enabled: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Enable workflow</span>
          </label>
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          )}
          <button
            onClick={handlePreview}
            disabled={previewing}
            className="px-6 py-2 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-2 disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            {previewing ? 'Previewing...' : 'Preview'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Workflow Preview (Sample Data)</h2>
              <button onClick={() => setPreviewData(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {previewData.map((step, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center justify-center">
                      {step.stepNumber}
                    </span>
                    <span className="font-medium text-gray-800 capitalize">
                      {step.type.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded p-3 text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(step.resolvedConfig, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getDefaultConfig = (stepType) => {
  switch (stepType) {
    case 'sendEmail':
      return { subject: '', message: '' };
    case 'sendSMS':
      return { message: '' };
    case 'wait':
      return { duration: 24, unit: 'hours' };
    case 'webhook':
      return { url: '', method: 'POST', payload: '{}' };
    default:
      return {};
  }
};

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

export default WorkflowBuilder;