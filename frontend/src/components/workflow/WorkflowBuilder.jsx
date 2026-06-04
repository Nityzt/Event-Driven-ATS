import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import WorkflowStep from './WorkflowStep';
import WorkflowTrigger from './WorkflowTrigger';
import StepPalette from './StepPalette';
import { workflowsAPI } from '../../api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Modal from '../ui/Modal';

const WorkflowBuilder = ({ existingWorkflow = null, onSave = null, onCancel = null }) => {
  const [workflow, setWorkflow] = useState(existingWorkflow || {
    name: '',
    triggers: [],
    steps: [],
    enabled: true,
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setWorkflow((prev) => {
        const oldIndex = prev.steps.findIndex((s) => s.id === active.id);
        const newIndex = prev.steps.findIndex((s) => s.id === over.id);
        return { ...prev, steps: arrayMove(prev.steps, oldIndex, newIndex) };
      });
    }
  };

  const addStep = (stepType) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: [...prev.steps, { id: `step_${Date.now()}`, type: stepType, config: getDefaultConfig(stepType) }],
    }));
  };

  const updateStep = (stepId, updates) => {
    setWorkflow((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => step.id === stepId ? { ...step, ...updates } : step),
    }));
  };

  const deleteStep = (stepId) => {
    setWorkflow((prev) => ({ ...prev, steps: prev.steps.filter((step) => step.id !== stepId) }));
  };

  const addTrigger = (trigger) => {
    setWorkflow((prev) => ({ ...prev, triggers: [...prev.triggers, trigger] }));
  };

  const removeTrigger = (index) => {
    setWorkflow((prev) => ({ ...prev, triggers: prev.triggers.filter((_, i) => i !== index) }));
  };

  const validate = () => {
    const newErrors = {};
    if (!workflow.name?.trim()) newErrors.name = 'Workflow name is required';
    if (!workflow.triggers.length) newErrors.triggers = 'At least one trigger is required';
    if (!workflow.steps.length) newErrors.steps = 'At least one step is required';

    workflow.steps.forEach((step, index) => {
      if ((step.type === 'sendEmail' || step.type === 'sendSMS') && !step.config.message?.trim()) {
        newErrors[`step_${index}`] = 'Message is required';
      }
      if (step.type === 'wait' && (!step.config.duration || step.config.duration <= 0)) {
        newErrors[`step_${index}`] = 'Duration must be greater than 0';
      }
      if (step.type === 'webhook' && !isValidUrl(step.config.url)) {
        newErrors[`step_${index}`] = 'Valid webhook URL is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePreview = async () => {
    if (!workflow.steps.length) {
      toast.error('Add at least one step to preview.');
      return;
    }
    setPreviewing(true);
    try {
      const response = await workflowsAPI.preview(workflow);
      setPreviewData(response.data?.resolvedSteps || []);
    } catch (err) {
      toast.error(`Preview failed: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (existingWorkflow) {
        await workflowsAPI.update(existingWorkflow._id, workflow);
      } else {
        await workflowsAPI.create(workflow);
      }
      toast.success(existingWorkflow ? 'Workflow updated' : 'Workflow created');
      onSave?.();
    } catch (error) {
      toast.error(`Failed to save workflow: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-card p-6">
        <h1 className="text-xl font-bold text-zinc-900 mb-6">
          {existingWorkflow ? 'Edit Workflow' : 'New Workflow'}
        </h1>

        {/* Workflow Name */}
        <div className="mb-6">
          <Input
            label="Workflow Name"
            value={workflow.name}
            onChange={(e) => setWorkflow({ ...workflow, name: e.target.value })}
            placeholder="e.g., Candidate Onboarding Flow"
            error={errors.name}
          />
        </div>

        {/* Triggers */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-3">Triggers</h2>
          <WorkflowTrigger triggers={workflow.triggers} onAdd={addTrigger} onRemove={removeTrigger} />
          {errors.triggers && <p className="text-red-500 text-sm mt-1">{errors.triggers}</p>}
        </div>

        {/* Steps */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-zinc-800 mb-3">Steps</h2>

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
            <div className="text-center py-8 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
              <p className="text-sm text-zinc-400">No steps added yet. Use the palette below to add steps.</p>
            </div>
          )}
          {errors.steps && <p className="text-red-500 text-sm mt-1">{errors.steps}</p>}
        </div>

        {/* Step Palette */}
        <StepPalette onAddStep={addStep} />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-zinc-200">
          <label className="flex items-center gap-2 mr-auto cursor-pointer">
            <input
              type="checkbox"
              checked={workflow.enabled}
              onChange={(e) => setWorkflow({ ...workflow, enabled: e.target.checked })}
              className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-zinc-700">Enable workflow</span>
          </label>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          )}
          <Button
            variant="outline"
            leftIcon={<Eye className="w-4 h-4" />}
            loading={previewing}
            onClick={handlePreview}
          >
            Preview
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {existingWorkflow ? 'Save Changes' : 'Create Workflow'}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={!!previewData}
        onClose={() => setPreviewData(null)}
        title="Workflow Preview (Sample Data)"
        size="lg"
      >
        {previewData?.length === 0 ? (
          <p className="text-sm text-zinc-400">No steps to preview.</p>
        ) : (
          <div className="space-y-4">
            {previewData?.map((step, i) => (
              <div key={i} className="border border-zinc-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 bg-brand-100 text-brand-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {step.stepNumber}
                  </span>
                  <span className="font-medium text-zinc-800 capitalize">
                    {step.type.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </div>
                <pre className="bg-zinc-50 rounded p-3 text-xs font-mono text-zinc-700 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(step.resolvedConfig, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

const getDefaultConfig = (stepType) => {
  switch (stepType) {
    case 'sendEmail': return { subject: '', message: '' };
    case 'sendSMS':   return { message: '' };
    case 'wait':      return { duration: 24, unit: 'hours' };
    case 'webhook':   return { url: '', method: 'POST', payload: '{}' };
    default:          return {};
  }
};

const isValidUrl = (string) => {
  try { new URL(string); return true; } catch { return false; }
};

export default WorkflowBuilder;
