import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, MapPin, Briefcase, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsAPI, applicationsAPI } from '../api';
import useDebounce from '../hooks/useDebounce';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { stageToBadgeVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { JobCardSkeleton } from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import ApplicationTimeline from '../components/timeline/ApplicationTimeline';
import ErrorBoundary from '../components/common/ErrorBoundary';

const STATUS_VARIANT = { Open: 'success', Closed: 'danger', 'On Hold': 'warning' };

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [timelineJob, setTimelineJob] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await jobsAPI.getAll(params);
      setJobs(response.data?.jobs || []);
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleDelete = async (id) => {
    try {
      await jobsAPI.delete(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      setConfirmDeleteId(null);
      toast.success('Job deleted');
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Jobs"
        subtitle="Manage your open positions and requirements"
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => { setEditingJob(null); setShowModal(true); }}
          >
            Post Job
          </Button>
        }
      />

      <Card padding="sm">
        <Input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search jobs by title, skills, location…"
          leftIcon={<Search className="w-4 h-4" />}
        />
      </Card>

      {loading ? (
        <JobCardSkeleton />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description={debouncedSearch ? `No jobs matching "${debouncedSearch}"` : 'Post your first job opening to start attracting candidates.'}
          action={!debouncedSearch ? { label: 'Post a Job', onClick: () => { setEditingJob(null); setShowModal(true); } } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs.map(job => (
            <JobCard
              key={job._id}
              job={job}
              confirmDelete={confirmDeleteId === job._id}
              onEdit={() => { setEditingJob(job); setShowModal(true); }}
              onDeleteIntent={() => setConfirmDeleteId(job._id)}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onDeleteConfirm={() => handleDelete(job._id)}
              onTimeline={() => setTimelineJob(job)}
            />
          ))}
        </div>
      )}

      <JobModal
        open={showModal}
        job={editingJob}
        onClose={() => { setShowModal(false); setEditingJob(null); }}
        onSuccess={() => { setShowModal(false); fetchJobs(); }}
      />

      <JobTimelineModal
        job={timelineJob}
        onClose={() => setTimelineJob(null)}
      />
    </div>
  );
};

const JobCard = ({ job, confirmDelete, onEdit, onDeleteIntent, onDeleteCancel, onDeleteConfirm, onTimeline }) => (
  <Card className="relative">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0 pr-3">
        <h3 className="text-base font-semibold text-stone-900 truncate">{job.title}</h3>
        <div className="flex items-center flex-wrap gap-3 text-xs text-stone-500 mt-1">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
          )}
          {job.seniority && (
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.seniority}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Badge variant={STATUS_VARIANT[job.status] || 'default'} size="sm">{job.status || 'Open'}</Badge>
        <button
          onClick={onTimeline}
          aria-label="View timeline"
          className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors ml-1"
        >
          <Clock className="w-3.5 h-3.5 text-stone-500" />
        </button>
        <button
          onClick={onEdit}
          aria-label="Edit job"
          className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <Edit2 className="w-3.5 h-3.5 text-stone-500" />
        </button>
        <button
          onClick={onDeleteIntent}
          aria-label="Delete job"
          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-500" />
        </button>
      </div>
    </div>

    {job.description && (
      <p className="text-sm text-stone-500 line-clamp-2 mb-3">{job.description}</p>
    )}

    {job.requiredSkills?.length > 0 && (
      <div className="mb-2">
        <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Required</p>
        <div className="flex flex-wrap gap-1.5">
          {job.requiredSkills.slice(0, 6).map((skill, i) => (
            <Badge key={i} variant="danger" size="sm">{skill}</Badge>
          ))}
          {job.requiredSkills.length > 6 && (
            <span className="text-xs text-stone-400">+{job.requiredSkills.length - 6}</span>
          )}
        </div>
      </div>
    )}

    {job.operationalSkills?.length > 0 && (
      <div className="mb-2">
        <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Operational</p>
        <div className="flex flex-wrap gap-1.5">
          {job.operationalSkills.slice(0, 3).map((skill, i) => (
            <Badge key={i} variant="info" size="sm">{skill}</Badge>
          ))}
          {job.operationalSkills.length > 3 && (
            <span className="text-xs text-stone-400">+{job.operationalSkills.length - 3}</span>
          )}
        </div>
      </div>
    )}

    {job.hygieneSkills?.length > 0 && (
      <div>
        <p className="text-2xs font-semibold text-stone-400 uppercase tracking-wide mb-1.5">Hygiene (+5% each)</p>
        <div className="flex flex-wrap gap-1.5">
          {job.hygieneSkills.slice(0, 4).map((skill, i) => (
            <Badge key={i} variant="success" size="sm">{skill}</Badge>
          ))}
        </div>
      </div>
    )}

    {confirmDelete && (
      <div className="absolute inset-0 bg-white/95 rounded-xl flex flex-col items-center justify-center gap-3 p-4">
        <div className="flex items-center gap-2 text-stone-700">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-medium">Delete this job?</span>
        </div>
        <p className="text-xs text-stone-500 text-center">This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDeleteCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onDeleteConfirm}>Delete</Button>
        </div>
      </div>
    )}
  </Card>
);

const JobModal = ({ open, job, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '', description: '', location: '', seniority: '', requiredSkills: '', operationalSkills: '', hygieneSkills: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        title:             job?.title || '',
        description:       job?.description || '',
        location:          job?.location || '',
        seniority:         job?.seniority || '',
        requiredSkills:    job?.requiredSkills?.join(', ')    || '',
        operationalSkills: job?.operationalSkills?.join(', ') || '',
        hygieneSkills:     job?.hygieneSkills?.join(', ')     || '',
      });
    }
  }, [open, job]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const payload = {
        ...formData,
        requiredSkills:    formData.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
        operationalSkills: formData.operationalSkills.split(',').map(s => s.trim()).filter(Boolean),
        hygieneSkills:     formData.hygieneSkills.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (job) {
        await jobsAPI.update(job._id, payload);
        toast.success('Job updated');
      } else {
        await jobsAPI.create(payload);
        toast.success('Job posted');
      }
      onSuccess();
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={job ? 'Edit Job' : 'Post New Job'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {job ? 'Update Job' : 'Post Job'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Job Title *" value={formData.title} onChange={set('title')} placeholder="Senior Frontend Engineer" required />
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={set('description')}
            className="w-full rounded-xl border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors resize-none"
            placeholder="Describe the role, responsibilities, and requirements…"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Location" value={formData.location} onChange={set('location')} placeholder="Remote, New York…" />
          <Select label="Seniority" value={formData.seniority} onChange={set('seniority')}>
            <option value="">Select level…</option>
            <option>Entry</option>
            <option>Mid</option>
            <option>Senior</option>
            <option>Lead</option>
            <option>Executive</option>
          </Select>
        </div>
        <Input
          label="Required Skills (comma-separated)"
          value={formData.requiredSkills}
          onChange={set('requiredSkills')}
          placeholder="React, TypeScript, Node.js"
          hint="Hard requirements — used in matching score"
        />
        <Input
          label="Operational Skills (comma-separated)"
          value={formData.operationalSkills}
          onChange={set('operationalSkills')}
          placeholder="TypeScript, Docker, Redis"
          hint="Technical skills that refine the candidate match score"
        />
        <Input
          label="Hygiene Skills (comma-separated)"
          value={formData.hygieneSkills}
          onChange={set('hygieneSkills')}
          placeholder="Git, Agile, Docker"
          hint="Nice-to-haves — each adds +5% to match score"
        />
      </form>
    </Modal>
  );
};

const JobTimelineModal = ({ job, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!job) return;
    setLoading(true);
    applicationsAPI.getAll({ jobId: job._id })
      .then(res => setApplications(res.data?.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [job]);

  return (
    <Modal
      open={!!job}
      onClose={onClose}
      title={job ? `Timeline — ${job.title}` : 'Timeline'}
      size="xl"
    >
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No applications"
          description="No candidates have applied to this job yet."
        />
      ) : (
        <div className="space-y-6">
          {applications.map(app => (
            <div key={app._id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-stone-800">
                  {app.candidateId?.name || app.candidate?.name || 'Unknown Candidate'}
                </span>
                <Badge variant={stageToBadgeVariant(app.stage)} size="sm">{app.stage}</Badge>
              </div>
              <ErrorBoundary>
                <ApplicationTimeline applicationId={app._id} />
              </ErrorBoundary>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default Jobs;
