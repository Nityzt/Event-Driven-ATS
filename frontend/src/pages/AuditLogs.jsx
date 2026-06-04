import { useState, useEffect } from 'react';
import { Search, Shield, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../api/client';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import EmptyState from '../components/ui/EmptyState';
import PageHeader from '../components/ui/PageHeader';
import { TableRowSkeleton } from '../components/ui/Skeleton';

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

      {/* Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Timestamp</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Action</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Resource</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">User</th>
                <th scope="col" className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Ref ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <TableRowSkeleton rows={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Shield}
                      title="No audit logs found"
                      description="Try adjusting your search or filter criteria."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(log => (
                  <>
                    <tr
                      key={log._id}
                      className="hover:bg-zinc-50 cursor-pointer transition-colors"
                      onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                    >
                      <td className="px-5 py-3.5 text-zinc-500 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={actionToVariant(log.action)} size="sm">{log.action}</Badge>
                      </td>
                      <td className="px-5 py-3.5 text-zinc-700">{log.resource || '—'}</td>
                      <td className="px-5 py-3.5 text-zinc-600 text-xs">
                        {log.user?.name || log.user?.email || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-zinc-400 text-xs flex items-center gap-1">
                        {log.correlationId ? `${log.correlationId.slice(0, 8)}…` : '—'}
                        {expandedLog === log._id
                          ? <ChevronUp className="w-3.5 h-3.5 ml-auto" />
                          : <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-30" />
                        }
                      </td>
                    </tr>
                    {expandedLog === log._id && (
                      <tr key={`${log._id}-expand`} className="bg-zinc-50">
                        <td colSpan={5} className="px-5 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                            {log.changes?.before && (
                              <div>
                                <p className="font-semibold text-zinc-500 mb-1.5 font-sans">Before</p>
                                <pre className="bg-white border border-zinc-200 rounded-lg p-3 overflow-x-auto text-zinc-600 text-xs leading-relaxed">
                                  {JSON.stringify(log.changes.before, null, 2)}
                                </pre>
                              </div>
                            )}
                            {log.changes?.after && (
                              <div>
                                <p className="font-semibold text-zinc-500 mb-1.5 font-sans">After</p>
                                <pre className="bg-white border border-zinc-200 rounded-lg p-3 overflow-x-auto text-zinc-600 text-xs leading-relaxed">
                                  {JSON.stringify(log.changes.after, null, 2)}
                                </pre>
                              </div>
                            )}
                            {!log.changes?.before && !log.changes?.after && (
                              <p className="text-zinc-400 font-sans">No change data recorded.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditLogs;
