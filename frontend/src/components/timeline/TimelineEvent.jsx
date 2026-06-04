import { Mail, MessageSquare, Clock, Webhook, CheckCircle, XCircle, PlayCircle, PauseCircle, AlertCircle } from 'lucide-react';

const TimelineEvent = ({ event, isLast }) => {
  const getEventIcon = () => {
    if (event.type?.includes('workflow')) {
      switch (event.status || event.type) {
        case 'started':
        case 'workflow.started':
          return <PlayCircle className="w-5 h-5 text-brand-600" />;
        case 'completed':
        case 'workflow.completed':
          return <CheckCircle className="w-5 h-5 text-green-600" />;
        case 'failed':
        case 'workflow.failed':
          return <XCircle className="w-5 h-5 text-red-600" />;
        case 'paused':
        case 'workflow.paused':
          return <PauseCircle className="w-5 h-5 text-amber-500" />;
        default:
          return <AlertCircle className="w-5 h-5 text-zinc-500" />;
      }
    }

    switch (event.stepType || event.type) {
      case 'sendEmail':
      case 'email.sent':
        return <Mail className="w-5 h-5 text-purple-600" />;
      case 'sendSMS':
      case 'sms.sent':
        return <MessageSquare className="w-5 h-5 text-green-600" />;
      case 'wait':
      case 'wait.started':
        return <Clock className="w-5 h-5 text-brand-600" />;
      case 'webhook':
      case 'webhook.called':
        return <Webhook className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-zinc-400" />;
    }
  };

  const getEventTitle = () => {
    if (event.title) return event.title;
    const titles = {
      'workflow.started':    'Workflow Started',
      'workflow.completed':  'Workflow Completed',
      'workflow.failed':     'Workflow Failed',
      'workflow.paused':     'Workflow Paused',
      'email.sent':          'Email Sent',
      'sms.sent':            'SMS Sent',
      'wait.started':        'Waiting Period Started',
      'wait.completed':      'Waiting Period Completed',
      'webhook.called':      'Webhook Called',
      'step.retry':          'Step Retrying',
    };
    return titles[event.type] || event.type || 'Event';
  };

  const getEventDescription = () => {
    if (event.description) return event.description;
    if (event.message) return event.message;
    if (event.stepType === 'wait') return `Waiting for ${event.duration} ${event.unit || 'hours'}`;
    if (event.stepType === 'sendEmail') return `Email sent to ${event.recipient || 'candidate'}`;
    if (event.stepType === 'sendSMS') return `SMS sent to ${event.recipient || 'candidate'}`;
    if (event.error) return `Error: ${event.error}`;
    return null;
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const diffMins = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return new Date(timestamp).toLocaleString();
  };

  const getStatusBadge = () => {
    const status = event.status || event.state;
    if (!status) return null;
    const classes = {
      completed: 'bg-green-100 text-green-700',
      success:   'bg-green-100 text-green-700',
      failed:    'bg-red-100 text-red-700',
      error:     'bg-red-100 text-red-700',
      running:   'bg-brand-100 text-brand-700',
      pending:   'bg-amber-100 text-amber-700',
      paused:    'bg-amber-100 text-amber-700',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${classes[status] || 'bg-zinc-100 text-zinc-600'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0">
          {getEventIcon()}
        </div>
        {!isLast && <div className="w-px flex-1 bg-zinc-200 mt-2" style={{ minHeight: 32 }} />}
      </div>

      <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-zinc-800">{getEventTitle()}</p>
              {getStatusBadge()}
            </div>
            {getEventDescription() && (
              <p className="text-xs text-zinc-500 mb-1">{getEventDescription()}</p>
            )}
            {event.metadata && (
              <pre className="text-xs text-zinc-500 bg-zinc-50 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
            {event.retryCount > 0 && (
              <p className="text-xs text-orange-600 mt-1">Retry attempt {event.retryCount}</p>
            )}
          </div>
          <span className="text-xs text-zinc-400 flex-shrink-0">
            {formatTimestamp(event.timestamp || event.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineEvent;
