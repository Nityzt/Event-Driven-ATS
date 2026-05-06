// src/components/timeline/ApplicationTimeline.jsx
import { useState, useEffect, useCallback } from 'react';
import { Activity } from 'lucide-react';
import useSSE from '../../hooks/useSSE';
import apiClient from '../../api/client';
import TimelineEvent from './TimelineEvent';

const ApplicationTimeline = ({ applicationId }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // SSE connection for real-time updates
  const { isConnected } = useSSE(
    `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/applications/${applicationId}/timeline/stream`,
    {
      enabled: !!applicationId,
      onMessage: (event) => {
        // Add new event to timeline
        setEvents((prev) => [event, ...prev]);
      }
    }
  );

  const fetchTimeline = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/applications/${applicationId}/timeline`);
      const timelineData = response.data?.timeline || response.timeline || [];
      setEvents(timelineData);
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (applicationId) {
      fetchTimeline();
    }
  }, [applicationId, fetchTimeline]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Application Timeline
        </h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No timeline events yet
        </div>
      ) : (
        <div className="space-y-4">
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