// src/components/workflow/StepPalette.jsx
import { Mail, MessageSquare, Clock, Webhook } from 'lucide-react';

const StepPalette = ({ onAddStep }) => {
  const steps = [
    {
      type: 'sendEmail',
      icon: Mail,
      label: 'Send Email',
      description: 'Send email to candidate'
    },
    {
      type: 'sendSMS',
      icon: MessageSquare,
      label: 'Send SMS',
      description: 'Send SMS to candidate'
    },
    {
      type: 'wait',
      icon: Clock,
      label: 'Wait',
      description: 'Pause workflow for duration'
    },
    {
      type: 'webhook',
      icon: Webhook,
      label: 'Webhook',
      description: 'Call external API'
    }
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <h3 className="font-semibold text-gray-700 mb-3">Add Step</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <button
              key={step.type}
              onClick={() => onAddStep(step.type)}
              className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Icon className="w-6 h-6 text-blue-600" />
              <div className="text-center">
                <p className="font-medium text-sm text-gray-800">{step.label}</p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepPalette;