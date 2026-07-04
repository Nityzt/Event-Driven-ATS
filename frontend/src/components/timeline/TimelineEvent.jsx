import { Mail, MessageSquare, Clock, Webhook, CheckCircle, XCircle, PlayCircle, PauseCircle, AlertCircle, ArrowRightCircle } from 'lucide-react';

const TimelineEvent = ({ event, isLast }) => {
  const getEventIcon = () => {
    if (event.type === 'stage.changed') {
      return <ArrowRightCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
    }

    if (event.type?.includes('workflow')) {
      switch (event.status || event.type) {
        case 'started':
        case 'workflow.started':
          return <PlayCircle className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
        case 'completed':
        case 'workflow.completed':
          return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
        case 'failed':
        case 'workflow.failed':
          return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
        case 'paused':
        case 'workflow.paused':
          return <PauseCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
        default:
          return <AlertCircle className="w-5 h-5 text-stone-500 dark:text-stone-400" />;
      }
    }

    switch (event.stepType || event.type) {
      case 'sendEmail':
      case 'email.sent':
        return <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'sendSMS':
      case 'sms.sent':
        return <MessageSquare className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'wait':
      case 'wait.started':
        return <Clock className="w-5 h-5 text-brand-600 dark:text-brand-400" />;
      case 'webhook':
      case 'webhook.called':
        return <Webhook className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-stone-400 dark:text-stone-500" />;
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
      completed: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      success:   'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
      failed:    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      error:     'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
      running:   'bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300',
      pending:   'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
      paused:    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${classes[status] || 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-center flex-shrink-0">
          {getEventIcon()}
        </div>
        {!isLast && <div className="w-px flex-1 bg-stone-200 dark:bg-stone-700 mt-2" style={{ minHeight: 32 }} />}
      </div>

      <div className={`flex-1 pb-5 ${isLast ? '' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{getEventTitle()}</p>
              {getStatusBadge()}
            </div>
            {(() => {
              const desc = getEventDescription();
              if (!desc) return null;
              const previewIdx = desc.indexOf('Preview: ');
              if (previewIdx === -1) {
                return <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">{desc}</p>;
              }
              const textPart = desc.slice(0, previewIdx).trim();
              const urlPart = desc.slice(previewIdx + 'Preview: '.length).trim();
              return (
                <p className="text-xs text-stone-500 dark:text-stone-400 mb-1">
                  {textPart && <>{textPart}{' '}</>}
                  <a
                    href={urlPart}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-600 dark:text-brand-400 hover:underline font-medium"
                  >
                    Preview email →
                  </a>
                </p>
              );
            })()}
            {event.metadata && (
              <pre className="text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(event.metadata, null, 2)}
              </pre>
            )}
            {event.retryCount > 0 && (
              <p className="text-xs text-orange-600 mt-1">Retry attempt {event.retryCount}</p>
            )}
          </div>
          <span className="text-xs text-stone-400 dark:text-stone-500 flex-shrink-0">
            {formatTimestamp(event.timestamp || event.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TimelineEvent;
