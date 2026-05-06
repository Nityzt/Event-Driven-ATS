// src/components/timeline/TimelineEvent.jsx
import { Mail, MessageSquare, Clock, Webhook, CheckCircle, XCircle, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';

const TimelineEvent = ({ event, isLast }) => {
  const getEventIcon = () => {
    // Workflow events
    if (event.type?.includes('workflow')) {
      switch (event.status || event.type) {
        case 'started':
        case 'workflow.started':
          return <PlayCircle className="w-5 h-5 text-blue-600" />;
        case 'completed':
        case 'workflow.completed':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'failed':
        case 'workflow.failed':
          return <XCircle className="w-5 h-5 text-red-600" />;
        case 'paused':
        case 'workflow.paused':
          return <PauseCircle className="w-5 h-5 text-yellow-600" />;
        default:
          return <AlertCircle className="w-5 h-5 text-gray-600" />;
      }
    }

    // Step events
    switch (event.stepType || event.type) {
      case 'sendEmail':
      case 'email.sent':
        return <Mail className="w-5 h-5 text-purple-600" />;
      case 'sendSMS':
      case 'sms.sent':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'wait':
      case 'wait.started':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'webhook':
      case 'webhook.called':
        return <Webhook className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventTitle = () => {
    if (event.title) return event.title;

    switch (event.type) {
      case 'workflow.started':
        return 'Workflow Started';
      case 'workflow.completed':
        return 'Workflow Completed';
      case 'workflow.failed':
        return 'Workflow Failed';
      case 'workflow.paused':
        return 'Workflow Paused';
      case 'email.sent':
        return 'Email Sent';
      case 'sms.sent':
        return 'SMS Sent';
      case 'wait.started':
        return 'Waiting Period Started';
      case 'wait.completed':
        return 'Waiting Period Completed';
      case 'webhook.called':
        return 'Webhook Called';
      case 'step.retry':
        return 'Step Retrying';
      default:
        return event.type || 'Event';
    }
  };

  const getEventDescription = () => {
    if (event.description) return event.description;
    if (event.message) return event.message;

    // Generate description based on event data
    if (event.stepType === 'wait') {
      return `Waiting for ${event.duration} ${event.unit || 'hours'}`;
    }

    if (event.stepType === 'sendEmail') {
      return `Email sent to ${event.recipient || 'candidate'}`;
    }

    if (event.stepType === 'sendSMS') {
      return `SMS sent to ${event.recipient || 'candidate'}`;
    }

    if (event.error) {
      return `Error: ${event.error}`;
    }

    return null;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return date.toLocaleString();
  };

  const getStatusBadge = () => {
    const status = event.status || event.state;
    if (!status) return null;

    const badges = {
      completed: 'bg-green-100 text-green-800',
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      error: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      paused: 'bg-yellow-100 text-yellow-800'
    };

    const badgeClass = badges[status] || 'bg-gray-100 text-gray-800';

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badgeClass}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex gap-4">
      {/* Timeline Line */}
      <div className="flex flex-col items-center">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
          {getEventIcon()}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-gray-200 mt-2" style={{ minHeight: '40px' }} />
        )}
      </div>

      {/* Event Content */}
      <div className={`flex-1 pb-6 ${isLast ? '' : 'border-b border-gray-100'}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-800">{getEventTitle()}</h3>
              {getStatusBadge()}
            </div>
            
            {getEventDescription() && (
              <p className="text-sm text-gray-600 mb-2">{getEventDescription()}</p>
            )}

            {/* Additional Details */}
            {event.metadata && (
              <div className="text-xs text-gray-500 bg-gray-50 rounded p-2 mt-2">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(event.metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Retry Information */}
            {event.retryCount > 0 && (
              <p className="text-xs text-orange-600 mt-1">
                Retry attempt {event.retryCount}
              </p>
            )}
          </div>

          {/* Timestamp */}
          <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
            {formatTimestamp(event.timestamp || event.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineEvent;