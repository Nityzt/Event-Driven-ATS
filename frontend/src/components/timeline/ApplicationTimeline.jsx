import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import useSSE from '../../hooks/useSSE';
import apiClient from '../../api/client';
import TimelineEvent from './TimelineEvent';
import Spinner from '../ui/Spinner';

const ApplicationTimeline = ({ applicationId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const { isConnected } = useSSE(
    `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/applications/${applicationId}/timeline/stream`,
    {
      enabled: !!applicationId,
      onMessage: event => setEvents(prev => [event, ...prev]),
    }
  );

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/applications/${applicationId}/timeline`);
      setEvents(response.data?.timeline || response.timeline || []);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) fetchTimeline();
  }, [applicationId, fetchTimeline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-10">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          Application Timeline
        </h2>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`} />
          <span className="text-xs text-zinc-500">{isConnected ? 'Live' : 'Offline'}</span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-10 text-sm text-zinc-400">
          No timeline events yet
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <TimelineEvent
              key={event._id || index}
              event={event}
              isLast={index === events.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationTimeline;
