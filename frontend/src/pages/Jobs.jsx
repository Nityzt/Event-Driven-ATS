import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Briefcase } from 'lucide-react';
import { jobsAPI } from '../api';
import useDebounce from '../hooks/useDebounce';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await jobsAPI.getAll(params);
      setJobs(response.data?.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await jobsAPI.delete(id);
      setJobs(jobs.filter(j => j._id !== id));
    } catch (error) {
      alert(`Failed to delete job: ${error.message}`);
    }
  };

  return (
    // ... rest of the component stays the same
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
        <button
          onClick={() => { setEditingJob(null); setShowModal(true); }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Post Job
        </button>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500">No jobs found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onEdit={() => { setEditingJob(job); setShowModal(true); }}
              onDelete={() => handleDelete(job._id)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <JobModal
          job={editingJob}
          onClose={() => { setShowModal(false); setEditingJob(null); }}
          onSuccess={() => { setShowModal(false); fetchJobs(); }}
        />
      )}
    </div>
  );
};

const JobCard = ({ job, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-2">{job.title}</h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {job.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{job.location}</span>
            </div>
          )}
          {job.seniority && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{job.seniority}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded">
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>

    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{job.description}</p>

    {job.requiredSkills?.length > 0 && (
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-600 mb-2">Required Skills</p>
        <div className="flex flex-wrap gap-2">
          {job.requiredSkills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
              {skill}
            </span>
          ))}
          {job.requiredSkills.length > 5 && (
            <span className="px-2 py-1 text-gray-500 text-xs">+{job.requiredSkills.length - 5}</span>
          )}
        </div>
      </div>
    )}

    {job.hygieneSkills?.length > 0 && (
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">Hygiene Skills (+5% each)</p>
        <div className="flex flex-wrap gap-2">
          {job.hygieneSkills.slice(0, 5).map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
              {skill}
            </span>
          ))}
        </div>
      </div>
    )}
  </div>
);

const JobModal = ({ job, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: job?.title || '',
    description: job?.description || '',
    location: job?.location || '',
    seniority: job?.seniority || '',
    requiredSkills: job?.requiredSkills?.join(', ') || '',
    hygieneSkills: job?.hygieneSkills?.join(', ') || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dataToSubmit = {
        ...formData,
        requiredSkills: formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        hygieneSkills: formData.hygieneSkills.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (job) {
        await jobsAPI.update(job._id, dataToSubmit);
      } else {
        await jobsAPI.create(dataToSubmit);
      }
      onSuccess();
    } catch (error) {
      alert(`Failed to save job: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">{job ? 'Edit Job' : 'Post New Job'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Seniority</label>
              <select
                value={formData.seniority}
                onChange={(e) => setFormData({ ...formData, seniority: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Required Skills (comma-separated)</label>
            <input
              type="text"
              value={formData.requiredSkills}
              onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hygiene Skills (comma-separated, +5% each)</label>
            <input
              type="text"
              value={formData.hygieneSkills}
              onChange={(e) => setFormData({ ...formData, hygieneSkills: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {saving ? 'Saving...' : job ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Jobs;