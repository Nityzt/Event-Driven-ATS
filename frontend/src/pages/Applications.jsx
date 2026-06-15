import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, FileText, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationsAPI, workflowsAPI, runsAPI } from '../api';
import ApplicationTimeline from '../components/timeline/ApplicationTimeline';
import ErrorBoundary from '../components/common/ErrorBoundary';
import useDebounce from '../hooks/useDebounce';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge, { stageToBadgeVariant } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import Spinner from '../components/ui/Spinner';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const TriggerModal = ({ app, onClose, onTriggered }) => {
  const [workflows, setWorkflows] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    workflowsAPI.getAll()
      .then(res => {
        const all = res.data || [];
        setWorkflows(all.filter(w => w.enabled));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRun = async () => {
    if (!selected) return;
    setRunning(true);
    try {
      await runsAPI.trigger(selected, app._id);
      toast.success('Workflow triggered — check the timeline');
      onClose();
      onTriggered(app);
    } catch (err) {
      toast.error(`Failed to trigger: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Trigger Workflow — ${app.candidate?.name || 'Application'}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            disabled={!selected || running}
            loading={running}
            leftIcon={<Zap className="w-3.5 h-3.5" />}
            onClick={handleRun}
          >
            Run
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="py-8 flex justify-center"><Spinner size="md" /></div>
      ) : workflows.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No enabled workflows"
          description="Enable a workflow first before triggering it here."
        />
      ) : (
        <div className="space-y-2">
          {workflows.map(w => (
            <div
              key={w._id}
              onClick={() => setSelected(w._id)}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selected === w._id
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <p className="text-sm font-medium text-stone-800">{w.name}</p>
              <p className="text-xs text-stone-500">
                {w.steps?.length || 0} step{w.steps?.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

// ── shared cells (reused by the desktop table and the mobile cards) ─────────────

function CandidateIdentity({ app }) {
  const name = app.candidate?.name || 'Unknown';
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
        {(name).charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">{name}</p>
        <p className="text-xs text-stone-400 truncate">{app.candidate?.email}</p>
      </div>
    </div>
  );
}

function StageControl({ stage, onChange }) {
  return (
    <select
      value={stage}
      onChange={onChange}
      aria-label="Change application stage"
      className="text-xs border border-stone-200 rounded-md px-2 py-1 bg-white text-stone-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
    >
      {STAGES.map(s => <option key={s}>{s}</option>)}
    </select>
  );
}

function ApplicationActions({ onView, onTrigger }) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />} onClick={onView}>
        Timeline
      </Button>
      <Button variant="ghost" size="sm" leftIcon={<Zap className="w-3.5 h-3.5" />} onClick={onTrigger} title="Trigger workflow">
        Trigger
      </Button>
    </div>
  );
}

function ApplicationListSkeleton() {
  return (
    <Card padding="none">
      <div className="divide-y divide-stone-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-4 sm:px-6">
            <div className="skeleton-shimmer w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-3.5 w-1/3 rounded" />
              <div className="skeleton-shimmer h-3 w-1/4 rounded" />
            </div>
            <div className="skeleton-shimmer h-6 w-16 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </Card>
  );
}

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [triggerApp, setTriggerApp] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await applicationsAPI.getAll(params);
      setApplications(response.data?.applications || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const handleStageChange = async (applicationId, newStage) => {
    const prev = applications.find(a => a._id === applicationId)?.stage;
    setApplications(apps => apps.map(a => a._id === applicationId ? { ...a, stage: newStage } : a));
    try {
      await applicationsAPI.updateStage(applicationId, newStage);
      toast.success(`Stage updated to ${newStage}`);
    } catch (err) {
      setApplications(apps => apps.map(a => a._id === applicationId ? { ...a, stage: prev } : a));
      toast.error(`Failed to update stage: ${err.message}`);
    }
  };

  const viewTimeline = (app) => { setSelectedApp(app); setShowTimeline(true); };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Applications"
        subtitle="Track and manage candidate applications through the pipeline"
      />

      <Card padding="sm">
        <Input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search applications…"
          leftIcon={<Search className="w-4 h-4" />}
        />
      </Card>

      {loading ? (
        <ApplicationListSkeleton />
      ) : applications.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={FileText}
            title="No applications found"
            description={debouncedSearch ? `No applications matching "${debouncedSearch}"` : 'Applications appear here when candidates apply to your job openings.'}
          />
        </Card>
      ) : (
        <>
          {/* Desktop — table */}
          <Card padding="none" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Candidate</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Position</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Stage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Applied</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {applications.map(app => (
                    <tr key={app._id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4"><CandidateIdentity app={app} /></td>
                      <td className="px-6 py-4 text-sm text-stone-700">{app.job?.title || 'Unknown'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant={stageToBadgeVariant(app.stage)} size="sm">{app.stage}</Badge>
                          <StageControl stage={app.stage} onChange={e => handleStageChange(app._id, e.target.value)} />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-stone-500">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <ApplicationActions onView={() => viewTimeline(app)} onTrigger={() => setTriggerApp(app)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile — stacked cards */}
          <div className="md:hidden space-y-3">
            {applications.map(app => (
              <Card key={app._id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <CandidateIdentity app={app} />
                  <Badge variant={stageToBadgeVariant(app.stage)} size="sm">{app.stage}</Badge>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-stone-500">
                  <span className="truncate">{app.job?.title || 'Unknown'}</span>
                  <span className="flex-shrink-0 tabular-nums">{new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                  <StageControl stage={app.stage} onChange={e => handleStageChange(app._id, e.target.value)} />
                  <ApplicationActions onView={() => viewTimeline(app)} onTrigger={() => setTriggerApp(app)} />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        title={selectedApp ? `Timeline — ${selectedApp.candidate?.name || 'Application'}` : 'Application Timeline'}
        size="xl"
      >
        {selectedApp && <ErrorBoundary><ApplicationTimeline applicationId={selectedApp._id} /></ErrorBoundary>}
      </Modal>

      {triggerApp && (
        <TriggerModal
          app={triggerApp}
          onClose={() => setTriggerApp(null)}
          onTriggered={viewTimeline}
        />
      )}
    </div>
  );
};

export default Applications;
