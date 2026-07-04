import { useState, useEffect, Fragment } from 'react';
import { Search, Shield, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';

const ACTIONS = [
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT',
  'SMS_SENT', 'EMAIL_SENT', 'WEBHOOK_CALLED', 'WORKFLOW_TRIGGER', 'STAGE_CHANGE',
];

function actionToVariant(action) {
  const map = {
    CREATE:           'success',
    UPDATE:           'info',
    DELETE:           'danger',
    LOGIN:            'purple',
    LOGOUT:           'default',
    SMS_SENT:         'purple',
    EMAIL_SENT:       'brand',
    WEBHOOK_CALLED:   'info',
    WORKFLOW_TRIGGER: 'warning',
    STAGE_CHANGE:     'warning',
  };
  return map[action] || 'default';
}

function LogChanges({ log }) {
  const hasChanges = log.changes?.before || log.changes?.after;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
      {log.changes?.before && (
        <div>
          <p className="font-semibold text-stone-500 dark:text-stone-400 mb-1.5 font-sans">Before</p>
          <pre className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 overflow-x-auto text-stone-600 dark:text-stone-400 text-xs leading-relaxed custom-scrollbar">
            {JSON.stringify(log.changes.before, null, 2)}
          </pre>
        </div>
      )}
      {log.changes?.after && (
        <div>
          <p className="font-semibold text-stone-500 dark:text-stone-400 mb-1.5 font-sans">After</p>
          <pre className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-3 overflow-x-auto text-stone-600 dark:text-stone-400 text-xs leading-relaxed custom-scrollbar">
            {JSON.stringify(log.changes.after, null, 2)}
          </pre>
        </div>
      )}
      {!hasChanges && <p className="text-stone-400 dark:text-stone-500 font-sans">No change data recorded.</p>}
    </div>
  );
}

function AuditLogSkeleton() {
  return (
    <Card padding="none">
      <div className="divide-y divide-stone-100 dark:divide-stone-800">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="skeleton-shimmer h-6 w-20 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-3.5 w-1/3 rounded" />
              <div className="skeleton-shimmer h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [expandedLog, setExpandedLog] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  useEffect(() => { fetchLogs(); }, [page, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = { page, limit: PAGE_SIZE };
      if (actionFilter) params.action = actionFilter;
      const res = await apiClient.get('/audit-logs', { params });
      const data = res.data?.data || res.data || {};
      setLogs(data.logs || data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter(log => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      log.resource?.toLowerCase().includes(q) ||
      log.correlationId?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="All system actions — who did what and when"
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => { setPage(1); fetchLogs(); }}
            aria-label="Refresh audit logs"
          >
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by action, resource, or correlation ID…"
            leftIcon={<Search className="w-4 h-4" />}
            className="flex-1"
          />
          <Select
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setPage(1); }}
            className="sm:w-48"
          >
            <option value="">All Actions</option>
            {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </Select>
        </div>
      </Card>

      {/* Logs */}
      {loading ? (
        <AuditLogSkeleton />
      ) : filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={Shield}
            title="No audit logs found"
            description="Try adjusting your search or filter criteria."
          />
        </Card>
      ) : (
        <>
          {/* Desktop — table */}
          <Card padding="none" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800">
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Timestamp</th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Action</th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Resource</th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">User</th>
                    <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">Ref ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filtered.map(log => {
                    const isOpen = expandedLog === log._id;
                    return (
                      <Fragment key={log._id}>
                        <tr
                          className="hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer transition-colors"
                          onClick={() => setExpandedLog(isOpen ? null : log._id)}
                        >
                          <td className="px-5 py-3.5 text-stone-500 dark:text-stone-400 whitespace-nowrap text-xs">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                          <td className="px-5 py-3.5">
                            <Badge variant={actionToVariant(log.action)} size="sm">{log.action}</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-stone-700 dark:text-stone-300">{log.resource || '—'}</td>
                          <td className="px-5 py-3.5 text-stone-600 dark:text-stone-400 text-xs">
                            {log.user?.name || log.user?.email || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-stone-400 dark:text-stone-500 text-xs">
                            <span className="flex items-center gap-1">
                              {log.correlationId ? `${log.correlationId.slice(0, 8)}…` : '—'}
                              {isOpen
                                ? <ChevronUp className="w-3.5 h-3.5 ml-auto" />
                                : <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-30" />
                              }
                            </span>
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-stone-50 dark:bg-stone-800/60">
                            <td colSpan={5} className="px-5 py-4"><LogChanges log={log} /></td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile — cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(log => {
              const isOpen = expandedLog === log._id;
              return (
                <Card key={log._id} padding="none" className="overflow-hidden">
                  <button
                    onClick={() => setExpandedLog(isOpen ? null : log._id)}
                    className="w-full text-left p-4 flex items-start gap-3"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={actionToVariant(log.action)} size="sm">{log.action}</Badge>
                        <span className="text-sm text-stone-700 dark:text-stone-300">{log.resource || '—'}</span>
                      </div>
                      <p className="text-xs text-stone-400 dark:text-stone-500">{new Date(log.createdAt).toLocaleString()}</p>
                      <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                        {log.user?.name || log.user?.email || '—'}
                        {log.correlationId && <span className="text-stone-400 dark:text-stone-500"> · {log.correlationId.slice(0, 8)}…</span>}
                      </p>
                    </div>
                    {isOpen
                      ? <ChevronUp className="w-4 h-4 text-stone-400 dark:text-stone-500 flex-shrink-0 mt-0.5" />
                      : <ChevronDown className="w-4 h-4 text-stone-300 dark:text-stone-600 flex-shrink-0 mt-0.5" />
                    }
                  </button>
                  {isOpen && (
                    <div className="border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 p-4">
                      <LogChanges log={log} />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <Card padding="none">
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default AuditLogs;
