// src/components/workflow/WorkflowStep.jsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Mail, MessageSquare, Clock, Webhook, Trash2 } from 'lucide-react';

const WorkflowStep = ({ step, index, onUpdate, onDelete, error }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: step.id 
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const updateConfig = (key, value) => {
    onUpdate(step.id, {
      config: { ...step.config, [key]: value }
    });
  };

  const getStepIcon = () => {
    switch (step.type) {
      case 'sendEmail': return <Mail className="w-5 h-5" />;
      case 'sendSMS': return <MessageSquare className="w-5 h-5" />;
      case 'wait': return <Clock className="w-5 h-5" />;
      case 'webhook': return <Webhook className="w-5 h-5" />;
      default: return null;
    }
  };

  const getStepTitle = () => {
    switch (step.type) {
      case 'sendEmail': return 'Send Email';
      case 'sendSMS': return 'Send SMS';
      case 'wait': return 'Wait';
      case 'webhook': return 'Webhook';
      default: return 'Unknown Step';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-lg p-4 ${error ? 'border-red-300' : 'border-gray-200'}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-move mt-1 text-gray-400 hover:text-gray-600"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Step Icon */}
        <div className="flex-shrink-0 mt-1 text-blue-600">
          {getStepIcon()}
        </div>

        {/* Step Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">
              {index + 1}. {getStepTitle()}
            </h3>
            <button
              onClick={() => onDelete(step.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Step-specific Configuration */}
          {step.type === 'sendEmail' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={step.config.subject || ''}
                  onChange={(e) => updateConfig('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email subject"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  value={step.config.message || ''}
                  onChange={(e) => updateConfig('message', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  placeholder="Use {{candidate.name}}, {{job.title}}, etc."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available variables: {'{'}{'{'} candidate.name {'}'}{'}'}, {'{'}{'{'} candidate.email {'}'}{'}'}, {'{'}{'{'} job.title {'}'}{'}'}, {'{'}{'{'} job.location {'}'}{'}'}
                </p>
              </div>
            </div>
          )}

          {step.type === 'sendSMS' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                value={step.config.message || ''}
                onChange={(e) => updateConfig('message', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Use {{candidate.name}}, {{candidate.phone}}, etc."
              />
              <p className="text-xs text-gray-500 mt-1">
                Available variables: {'{'}{'{'} candidate.name {'}'}{'}'}, {'{'}{'{'} candidate.phone {'}'}{'}'}, {'{'}{'{'} job.title {'}'}{'}'}
              </p>
            </div>
          )}

          {step.type === 'wait' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration
                </label>
                <input
                  type="number"
                  value={step.config.duration || 24}
                  onChange={(e) => updateConfig('duration', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit
                </label>
                <select
                  value={step.config.unit || 'hours'}
                  onChange={(e) => updateConfig('unit', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
            </div>
          )}

          {step.type === 'webhook' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={step.config.url || ''}
                  onChange={(e) => updateConfig('url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Method
                  </label>
                  <select
                    value={step.config.method || 'POST'}
                    onChange={(e) => updateConfig('method', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payload (JSON)
                  </label>
                  <textarea
                    value={step.config.payload || '{}'}
                    onChange={(e) => updateConfig('payload', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="2"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkflowStep;