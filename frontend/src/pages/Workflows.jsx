import { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit2, Activity, Square, RotateCcw, Clock } from 'lucide-react';
import WorkflowBuilder from '../components/workflow/WorkflowBuilder.jsx';
import { workflowsAPI, runsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';

const STATE_COLORS = {
  queued:    'bg-gray-100 text-gray-700',
  running:   'bg-blue-100 text-blue-700',
  paused:    'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed:    'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500'
};

const Workflows = () => {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('workflows'); // 'workflows' | 'runs'
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

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
    } catch (err) {
      alert(`Failed to toggle: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workflow?')) return;
    try {
      await workflowsAPI.delete(id);
      setWorkflows(prev => prev.filter(w => w._id !== id));
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleRunAction = async (runId, action) => {
    try {
      await runsAPI[action](runId);
      fetchRuns();
    } catch (err) {
      alert(`Failed to ${action} run: ${err.message}`);
    }
  };

  const openBuilder = (workflow = null) => {
    setEditingWorkflow(workflow);
    setShowBuilder(true);
  };

  const closeBuilder = () => {
    setEditingWorkflow(null);
    setShowBuilder(false);
  };

  if (showBuilder) {
    return (
      <WorkflowBuilder
        existingWorkflow={editingWorkflow}
        onSave={() => { closeBuilder(); fetchWorkflows(); }}
        onCancel={closeBuilder}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Workflows</h1>
          <p className="text-gray-600 mt-1">Automate your recruitment process</p>
        </div>
        {tab === 'workflows' && (
          <button
            onClick={() => openBuilder()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Workflow
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { key: 'workflows', label: 'Workflows' },
          { key: 'runs', label: 'Runs' }
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : tab === 'workflows' ? (
        workflows.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No workflows yet</p>
            <button onClick={() => openBuilder()} className="text-blue-600 hover:text-blue-800 font-medium">
              Create your first workflow →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {workflows.map(w => (
              <WorkflowCard
                key={w._id}
                workflow={w}
                onToggle={() => handleToggle(w._id)}
                onEdit={() => openBuilder(w)}
                onDelete={() => handleDelete(w._id)}
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

const WorkflowCard = ({ workflow, onToggle, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="text-lg font-semibold text-gray-800">{workflow.name}</h3>
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            workflow.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {workflow.enabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {workflow.triggers?.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-600 mb-1">Triggers:</p>
            <div className="flex flex-wrap gap-2">
              {workflow.triggers.map((t, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {t.event}
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          {workflow.steps?.length || 0} step{workflow.steps?.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onToggle}
          className={`p-2 rounded transition-colors ${
            workflow.enabled ? 'hover:bg-yellow-50 text-yellow-600' : 'hover:bg-green-50 text-green-600'
          }`}
          title={workflow.enabled ? 'Deactivate' : 'Activate'}
        >
          {workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
        <button onClick={onEdit} className="p-2 hover:bg-gray-100 rounded transition-colors" title="Edit">
          <Edit2 className="w-4 h-4 text-gray-600" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-red-50 rounded transition-colors" title="Delete">
          <Trash2 className="w-4 h-4 text-red-600" />
        </button>
      </div>
    </div>

    {workflow.steps?.length > 0 && (
      <div className="border-t pt-4 mt-4">
        <p className="text-xs font-medium text-gray-600 mb-2">Steps:</p>
        <div className="space-y-1">
          {workflow.steps.slice(0, 3).map((step, i) => (
            <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
              <span className="text-xs text-gray-400">{i + 1}.</span>
              <span className="capitalize">{step.type.replace(/([A-Z])/g, ' $1').trim()}</span>
            </div>
          ))}
          {workflow.steps.length > 3 && (
            <p className="text-xs text-gray-500">+{workflow.steps.length - 3} more</p>
          )}
        </div>
      </div>
    )}
  </div>
);

const RunsTable = ({ runs, onAction, hasRole }) => {
  const canControl = hasRole?.(['Admin', 'Recruiter']);

  if (!runs.length) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <Activity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">No workflow runs yet. Runs appear here when workflows are triggered.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Workflow</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">State</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Step</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">Started</th>
            {canControl && <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {runs.map(run => (
            <tr key={run._id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-800">
                {run.workflowId?.name || '—'}
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-1 rounded text-xs font-medium ${STATE_COLORS[run.state] || 'bg-gray-100 text-gray-600'}`}>
                  {run.state}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {run.stepPointer} / {run.workflowId?.steps?.length || '?'}
              </td>
              <td className="px-4 py-3 text-gray-500">
                {run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'}
              </td>
              {canControl && (
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {run.state === 'running' && (
                      <button
                        onClick={() => onAction(run._id, 'pause')}
                        className="p-1 hover:bg-yellow-50 rounded text-yellow-600"
                        title="Pause"
                      >
                        <Pause className="w-4 h-4" />
                      </button>
                    )}
                    {run.state === 'paused' && (
                      <button
                        onClick={() => onAction(run._id, 'resume')}
                        className="p-1 hover:bg-green-50 rounded text-green-600"
                        title="Resume"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {['running', 'paused', 'queued'].includes(run.state) && (
                      <button
                        onClick={() => onAction(run._id, 'cancel')}
                        className="p-1 hover:bg-red-50 rounded text-red-600"
                        title="Cancel"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Workflows;
