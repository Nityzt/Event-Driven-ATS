import { useState, useEffect } from 'react';
import { Briefcase, MapPin } from 'lucide-react';
import apiClient from '../../api/client';
import Spinner from '../ui/Spinner';

const JobSelector = ({ selectedJob, onSelect }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchJobs(); }, []);

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
        <Spinner size="sm" />
      </div>
    );
  }

  if (!jobs.length) {
    return (
      <div className="p-6 text-center text-sm text-stone-400 dark:text-stone-500">No jobs available</div>
    );
  }

  const filteredJobs = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="divide-y divide-stone-100 dark:divide-stone-800">
      <div className="p-2">
        <input
          type="text"
          placeholder="Search jobs…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-stone-200 dark:border-stone-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-stone-900"
        />
      </div>
      {filteredJobs.map(job => (
        <button
          key={job._id}
          onClick={() => onSelect(job)}
          className={`w-full text-left p-4 transition-colors ${
            selectedJob?._id === job._id
              ? 'bg-brand-50 dark:bg-brand-950/40 border-l-2 border-brand-600'
              : 'hover:bg-stone-50 dark:hover:bg-stone-800 border-l-2 border-transparent'
          }`}
        >
          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">{job.title}</p>
          <div className="space-y-0.5 text-xs text-stone-500 dark:text-stone-400">
            {job.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3" />
                {job.location}
              </div>
            )}
            {job.seniority && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" />
                {job.seniority}
              </div>
            )}
          </div>
          {job.requiredSkills?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 rounded text-xs">
                  {skill}
                </span>
              ))}
              {job.requiredSkills.length > 3 && (
                <span className="text-stone-400 dark:text-stone-500 text-xs">+{job.requiredSkills.length - 3}</span>
              )}
            </div>
          )}
          {job.operationalSkills?.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {job.operationalSkills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="px-1.5 py-0.5 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded text-xs">
                  {skill}
                </span>
              ))}
              {job.operationalSkills.length > 3 && (
                <span className="text-brand-400 text-xs">+{job.operationalSkills.length - 3}</span>
              )}
            </div>
          )}
        </button>
      ))}
      {filteredJobs.length === 0 && search && (
        <div className="p-6 text-center text-sm text-stone-400 dark:text-stone-500">No jobs match.</div>
      )}
    </div>
  );
};

export default JobSelector;
