// src/components/matching/JobSelector.jsx
import { useState, useEffect } from 'react';
import { Briefcase, MapPin, DollarSign } from 'lucide-react';
import apiClient from '../../api/client';

const JobSelector = ({ selectedJob, onSelect }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await apiClient.get('/jobs');
      setJobs(response.data?.jobs || response.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {jobs.map((job) => (
        <div
          key={job._id}
          onClick={() => onSelect(job)}
          className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
            selectedJob?._id === job._id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
          }`}
        >
          <h3 className="font-semibold text-gray-800 mb-2">{job.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{job.location}</span>
              </div>
            )}
            {job.seniority && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                <span>{job.seniority}</span>
              </div>
            )}
          </div>
          {job.requiredSkills?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                >
                  {skill}
                </span>
              ))}
              {job.requiredSkills.length > 3 && (
                <span className="px-2 py-0.5 text-gray-500 text-xs">
                  +{job.requiredSkills.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      ))}
      
      {jobs.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No jobs available
        </div>
      )}
    </div>
  );
};

export default JobSelector;
