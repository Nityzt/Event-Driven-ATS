import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit2, Trash2, Mail, Phone, MapPin, Users, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { candidatesAPI, applicationsAPI } from '../api';
import ResumeUploader from '../components/upload/ResumeUploader';
import useDebounce from '../hooks/useDebounce';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { stageToBadgeVariant } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { CandidateCardSkeleton } from '../components/ui/Skeleton';
import Spinner from '../components/ui/Spinner';
import ApplicationTimeline from '../components/timeline/ApplicationTimeline';
import ErrorBoundary from '../components/common/ErrorBoundary';

const STATUS_VARIANT = { Active: 'success', Inactive: 'default', Hired: 'brand', Rejected: 'danger' };

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [filters, setFilters] = useState({ location: '', seniority: '' });
  const [timelineCandidate, setTimelineCandidate] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...filters,
      };
      const response = await candidatesAPI.getAll(params);
      setCandidates(response.data?.candidates || []);
    } catch (err) {
      console.error('Failed to fetch candidates:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filters]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  const handleDelete = async (id) => {
    try {
      await candidatesAPI.delete(id);
      setCandidates(prev => prev.filter(c => c._id !== id));
      setConfirmDeleteId(null);
      toast.success('Candidate deleted');
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Candidates"
        subtitle="Manage your talent pool and candidate profiles"
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => { setEditingCandidate(null); setShowModal(true); }}
          >
            Add Candidate
          </Button>
        }
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search candidates…"
            leftIcon={<Search className="w-4 h-4" />}
          />
          <Select
            value={filters.location}
            onChange={e => setFilters(f => ({ ...f, location: e.target.value }))}
          >
            <option value="">All Locations</option>
            <option>Remote</option>
            <option>New York</option>
            <option>San Francisco</option>
            <option>London</option>
            <option>Toronto</option>
          </Select>
          <Select
            value={filters.seniority}
            onChange={e => setFilters(f => ({ ...f, seniority: e.target.value }))}
          >
            <option value="">All Seniority Levels</option>
            <option>Entry</option>
            <option>Mid</option>
            <option>Senior</option>
            <option>Lead</option>
            <option>Executive</option>
          </Select>
        </div>
      </Card>

      {loading ? (
        <CandidateCardSkeleton />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No candidates found"
          description={debouncedSearch ? `No candidates matching "${debouncedSearch}"` : 'Add your first candidate to start building your talent pool.'}
          action={!debouncedSearch ? { label: 'Add Candidate', onClick: () => { setEditingCandidate(null); setShowModal(true); } } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map(candidate => (
            <CandidateCard
              key={candidate._id}
              candidate={candidate}
              confirmDelete={confirmDeleteId === candidate._id}
              onEdit={() => { setEditingCandidate(candidate); setShowModal(true); }}
              onDeleteIntent={() => setConfirmDeleteId(candidate._id)}
              onDeleteCancel={() => setConfirmDeleteId(null)}
              onDeleteConfirm={() => handleDelete(candidate._id)}
              onTimeline={() => setTimelineCandidate(candidate)}
            />
          ))}
        </div>
      )}

      <CandidateModal
        open={showModal}
        candidate={editingCandidate}
        onClose={() => { setShowModal(false); setEditingCandidate(null); }}
        onSuccess={() => { setShowModal(false); fetchCandidates(); }}
      />

      <CandidateTimelineModal
        candidate={timelineCandidate}
        onClose={() => setTimelineCandidate(null)}
      />
    </div>
  );
};

const CandidateCard = ({ candidate, confirmDelete, onEdit, onDeleteIntent, onDeleteCancel, onDeleteConfirm, onTimeline }) => (
  <Card className="relative">
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 font-semibold text-sm flex-shrink-0">
          {candidate.name?.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">{candidate.name}</h3>
          <Badge variant={STATUS_VARIANT[candidate.status] || 'default'} size="sm">
            {candidate.status || 'Active'}
          </Badge>
        </div>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button onClick={onTimeline} aria-label="View timeline" className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
          <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        </button>
        <button onClick={onEdit} aria-label="Edit candidate" className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
          <Edit2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        </button>
        <button onClick={onDeleteIntent} aria-label="Delete candidate" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
        </button>
      </div>
    </div>

    <div className="space-y-1.5 text-xs text-stone-500 dark:text-stone-400 mb-3">
      {candidate.email && (
        <div className="flex items-center gap-2 truncate">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{candidate.email}</span>
        </div>
      )}
      {candidate.phone && (
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          {candidate.phone}
        </div>
      )}
      {candidate.location && (
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          {candidate.location}
        </div>
      )}
    </div>

    {candidate.skills?.length > 0 && (
      <div className="flex flex-wrap gap-1.5">
        {candidate.skills.slice(0, 4).map((skill, i) => (
          <Badge key={i} variant="info" size="sm">{skill}</Badge>
        ))}
        {candidate.skills.length > 4 && (
          <span className="text-xs text-stone-400 dark:text-stone-500">+{candidate.skills.length - 4}</span>
        )}
      </div>
    )}

    {confirmDelete && (
      <div className="absolute inset-0 bg-white/95 dark:bg-stone-900/95 rounded-xl flex flex-col items-center justify-center gap-3 p-4">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <span className="text-sm font-medium">Delete this candidate?</span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center">This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDeleteCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onDeleteConfirm}>Delete</Button>
        </div>
      </div>
    )}
  </Card>
);

const CandidateModal = ({ open, candidate, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', location: '', seniority: '', skills: '', resume: null,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        name:      candidate?.name     || '',
        email:     candidate?.email    || '',
        phone:     candidate?.phone    || '',
        location:  candidate?.location || '',
        seniority: candidate?.seniority || '',
        skills:    candidate?.skills?.join(', ') || '',
        resume:    null,
      });
      setErrors({});
    }
  }, [open, candidate]);

  const validate = () => {
    const e = {};
    if (!formData.name.trim()) e.name = 'Name is required';
    if (!formData.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = 'Invalid email format';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev?.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      };
      if (!payload.seniority) delete payload.seniority;
      if (candidate) {
        await candidatesAPI.update(candidate._id, payload);
        toast.success('Candidate updated');
      } else {
        await candidatesAPI.create(payload);
        toast.success('Candidate added');
      }
      onSuccess();
    } catch (err) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const set = (field) => (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, [field]: val }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={candidate ? 'Edit Candidate' : 'Add Candidate'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSubmit}>
            {candidate ? 'Update' : 'Add Candidate'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name *" value={formData.name} onChange={set('name')} error={errors.name} placeholder="Jane Smith" />
          <Input label="Email *" type="email" value={formData.email} onChange={set('email')} error={errors.email} placeholder="jane@example.com" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Phone" type="tel" value={formData.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
          <Input label="Location" value={formData.location} onChange={set('location')} placeholder="Remote, New York…" />
        </div>
        <Select label="Seniority Level" value={formData.seniority} onChange={set('seniority')}>
          <option value="">Select level…</option>
          <option>Entry</option>
          <option>Mid</option>
          <option>Senior</option>
          <option>Lead</option>
          <option>Executive</option>
        </Select>
        <Input
          label="Skills (comma-separated)"
          value={formData.skills}
          onChange={set('skills')}
          placeholder="JavaScript, React, Node.js"
          hint="Used for AI matching score"
        />
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-1.5">Resume (PDF only)</label>
          <ResumeUploader
            onFileSelect={file => setFormData(prev => ({ ...prev, resume: file }))}
            existingFile={candidate?.resume}
          />
        </div>
      </form>
    </Modal>
  );
};

const CandidateTimelineModal = ({ candidate, onClose }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!candidate) return;
    setLoading(true);
    applicationsAPI.getAll({ candidateId: candidate._id })
      .then(res => setApplications(res.data?.applications || []))
      .catch(() => setApplications([]))
      .finally(() => setLoading(false));
  }, [candidate]);

  return (
    <Modal
      open={!!candidate}
      onClose={onClose}
      title={candidate ? `Timeline — ${candidate.name}` : 'Timeline'}
      size="xl"
    >
      {loading ? (
        <div className="flex justify-center py-8"><Spinner size="md" /></div>
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No applications"
          description="This candidate has no applications yet."
        />
      ) : (
        <div className="space-y-6">
          {applications.map(app => (
            <div key={app._id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {app.jobId?.title || app.job?.title || 'Unknown Job'}
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

export default Candidates;
