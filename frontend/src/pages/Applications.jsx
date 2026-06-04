import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationsAPI } from '../api';
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
import { TableRowSkeleton } from '../components/ui/Skeleton';

const STAGES = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

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

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Candidate</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Position</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Stage</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Applied</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <TableRowSkeleton rows={6} />
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={FileText}
                      title="No applications found"
                      description={debouncedSearch ? `No applications matching "${debouncedSearch}"` : 'Applications appear here when candidates apply to your job openings.'}
                    />
                  </td>
                </tr>
              ) : (
                applications.map(app => (
                  <tr key={app._id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
                          {(app.candidate?.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-800">{app.candidate?.name || 'Unknown'}</p>
                          <p className="text-xs text-zinc-400">{app.candidate?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-700">{app.job?.title || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={stageToBadgeVariant(app.stage)} size="sm">{app.stage}</Badge>
                        <select
                          value={app.stage}
                          onChange={e => handleStageChange(app._id, e.target.value)}
                          aria-label="Change application stage"
                          className="text-xs border border-zinc-200 rounded-md px-2 py-1 bg-white text-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        >
                          {STAGES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => viewTimeline(app)}
                      >
                        Timeline
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={showTimeline}
        onClose={() => setShowTimeline(false)}
        title={selectedApp ? `Timeline — ${selectedApp.candidate?.name || 'Application'}` : 'Application Timeline'}
        size="xl"
      >
        {selectedApp && <ErrorBoundary><ApplicationTimeline applicationId={selectedApp._id} /></ErrorBoundary>}
      </Modal>
    </div>
  );
};

export default Applications;
