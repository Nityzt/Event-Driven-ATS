import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit2, Activity, Square, Workflow, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder.jsx';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { workflowsAPI, runsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Badge, { stateToBadgeVariant } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';

const Workflows = () => {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('workflows');
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => {
    if (tab === 'workflows') fetchWorkflows();
    else fetchRuns();
  }, [tab]);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const response = await workflowsAPI.getAll();
      setWorkflows(response.data || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRuns = async () => {
    setLoading(true);
    try {
      const response = await runsAPI.getAll();
      setRuns(response.data?.runs || []);
    } catch (err) {
      console.error('Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await workflowsAPI.toggle(id);
      setWorkflows(prev => prev.map(w => w._id === id ? { ...w, enabled: !w.enabled } : w));
      toast.success('Workflow updated');
    } catch (err) {
      toast.error(`Failed to toggle: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await workflowsAPI.delete(id);
      setWorkflows(prev => prev.filter(w => w._id !== id));
      setConfirmDeleteId(null);
      toast.success('Workflow deleted');
    } catch (err) {
      toast.error(`Failed to delete: ${err.message}`);
    }
  };

  const handleRunAction = async (runId, action) => {
    try {
      await runsAPI[action](runId);
      toast.success(`Run ${action}d`);
      fetchRuns();
    } catch (err) {
      toast.error(`Failed to ${action} run: ${err.message}`);
    }
  };

  const openBuilder = (workflow = null) => { setEditingWorkflow(workflow); setShowBuilder(true); };
  const closeBuilder = () => { setEditingWorkflow(null); setShowBuilder(false); };

  if (showBuilder) {
    return (
      <ErrorBoundary>
        <WorkflowBuilder
          existingWorkflow={editingWorkflow}
          onSave={() => { closeBuilder(); fetchWorkflows(); }}
          onCancel={closeBuilder}
        />
      </ErrorBoundary>
    );
  }

  const TABS = [
    { key: 'workflows', label: 'Workflows' },
    { key: 'runs',      label: 'Runs' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Workflows"
        subtitle="Automate your recruitment process with event-driven triggers and steps"
        actions={tab === 'workflows' && (
          <Button variant="primary" leftIcon={<Plus className="w-4 h-4" />} onClick={() => openBuilder()}>
            Create Workflow
          </Button>
        )}
      />

      {/* Tab bar */}
      <div className="inline-flex bg-stone-100 dark:bg-stone-800 rounded-xl p-1 gap-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              tab === t.key
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2].map(i => (
            <Card key={i}>
              <div className="skeleton-shimmer h-5 w-40 mb-3 rounded" />
              <div className="skeleton-shimmer h-4 w-24 mb-4 rounded" />
              <div className="flex gap-2">
                <div className="skeleton-shimmer h-6 w-20 rounded-full" />
                <div className="skeleton-shimmer h-6 w-16 rounded-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : tab === 'workflows' ? (
        workflows.length === 0 ? (
          <EmptyState
            icon={Workflow}
            title="No workflows yet"
            description="Build your first automation to streamline candidate screening, notifications, and pipeline management."
            action={{ label: 'Create Workflow', onClick: () => openBuilder() }}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {workflows.map(w => (
              <WorkflowCard
                key={w._id}
                workflow={w}
                confirmDelete={confirmDeleteId === w._id}
                onToggle={() => handleToggle(w._id)}
                onEdit={() => openBuilder(w)}
                onDeleteIntent={() => setConfirmDeleteId(w._id)}
                onDeleteCancel={() => setConfirmDeleteId(null)}
                onDeleteConfirm={() => handleDelete(w._id)}
              />
            ))}
          </div>
        )
      ) : (
        <RunsTable runs={runs} onAction={handleRunAction} hasRole={hasRole} />
      )}
    </div>
  );
};

const WorkflowCard = ({ workflow, confirmDelete, onToggle, onEdit, onDeleteIntent, onDeleteCancel, onDeleteConfirm }) => (
  <Card className="relative">
    <div className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0 pr-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">{workflow.name}</h3>
          <Badge variant={workflow.enabled ? 'success' : 'default'} size="sm">
            {workflow.enabled ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        {workflow.triggers?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {workflow.triggers.map((t, i) => (
              <Badge key={i} variant="brand" size="sm">{t.event}</Badge>
            ))}
          </div>
        )}
        <p className="text-xs text-stone-400 dark:text-stone-500">{workflow.steps?.length || 0} step{workflow.steps?.length !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        <button
          onClick={onToggle}
          aria-label={workflow.enabled ? 'Deactivate workflow' : 'Activate workflow'}
          className={`p-1.5 rounded-lg transition-colors ${workflow.enabled ? 'hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600 dark:text-amber-400' : 'hover:bg-green-50 dark:hover:bg-green-950/40 text-green-600 dark:text-green-400'}`}
        >
          {workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button onClick={onEdit} aria-label="Edit workflow" className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg transition-colors">
          <Edit2 className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
        </button>
        <button onClick={onDeleteIntent} aria-label="Delete workflow" className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
          <Trash2 className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
        </button>
      </div>
    </div>

    {workflow.steps?.length > 0 && (
      <div className="border-t border-stone-100 dark:border-stone-800 pt-3 mt-3">
        <div className="space-y-1">
          {workflow.steps.slice(0, 3).map((step, i) => (
            <div key={i} className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500 flex items-center justify-center text-2xs font-semibold flex-shrink-0">{i + 1}</span>
              <span className="capitalize">{step.type.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
          {workflow.steps.length > 3 && (
            <p className="text-xs text-stone-400 dark:text-stone-500 pl-6">+{workflow.steps.length - 3} more</p>
          )}
        </div>
      </div>
    )}

    {confirmDelete && (
      <div className="absolute inset-0 bg-white/95 dark:bg-stone-900/95 rounded-xl flex flex-col items-center justify-center gap-3 p-4">
        <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <span className="text-sm font-medium">Delete this workflow?</span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 text-center">All runs for this workflow will also be removed.</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onDeleteCancel}>Cancel</Button>
          <Button variant="danger" size="sm" onClick={onDeleteConfirm}>Delete</Button>
        </div>
      </div>
    )}
  </Card>
);

const RunControls = ({ run, onAction }) => (
  <div className="flex gap-1">
    {run.state === 'running' && (
      <button
        onClick={() => onAction(run._id, 'pause')}
        aria-label="Pause run"
        className="p-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg text-amber-600 dark:text-amber-400 transition-colors"
      >
        <Pause className="w-4 h-4" />
      </button>
    )}
    {run.state === 'paused' && (
      <button
        onClick={() => onAction(run._id, 'resume')}
        aria-label="Resume run"
        className="p-1.5 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg text-green-600 dark:text-green-400 transition-colors"
      >
        <Play className="w-4 h-4" />
      </button>
    )}
    {['running', 'paused', 'queued'].includes(run.state) && (
      <button
        onClick={() => onAction(run._id, 'cancel')}
        aria-label="Cancel run"
        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg text-red-500 dark:text-red-400 transition-colors"
      >
        <Square className="w-4 h-4" />
      </button>
    )}
  </div>
);

const RunsTable = ({ runs, onAction, hasRole }) => {
  const canControl = hasRole?.(['Admin', 'Recruiter']);

  if (!runs.length) {
    return (
      <EmptyState
        icon={Activity}
        title="No workflow runs yet"
        description="Runs appear here when workflows are triggered by application events."
      />
    );
  }

  return (
    <>
      {/* Desktop — table */}
      <Card padding="none" className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Workflow</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">State</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Progress</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Started</th>
                {canControl && <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {runs.map(run => (
                <tr key={run._id} className="hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-stone-800 dark:text-stone-200">
                    {run.workflowId?.name || '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <Badge variant={stateToBadgeVariant(run.state)} size="sm">{run.state}</Badge>
                  </td>
                  <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400 text-xs">
                    Step {run.stepPointer} / {run.workflowId?.steps?.length || '?'}
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 dark:text-stone-500 text-xs">
                    {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                  </td>
                  {canControl && (
                    <td className="px-5 py-3.5"><RunControls run={run} onAction={onAction} /></td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile — cards */}
      <div className="md:hidden space-y-3">
        {runs.map(run => (
          <Card key={run._id} className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200 truncate">{run.workflowId?.name || '—'}</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                  {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
                </p>
              </div>
              <Badge variant={stateToBadgeVariant(run.state)} size="sm">{run.state}</Badge>
            </div>
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100 dark:border-stone-800">
              <span className="text-xs text-stone-500 dark:text-stone-400">
                Step {run.stepPointer} / {run.workflowId?.steps?.length || '?'}
              </span>
              {canControl && <RunControls run={run} onAction={onAction} />}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
};

export default Workflows;
