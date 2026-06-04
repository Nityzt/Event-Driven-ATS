import { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import JobSelector from './JobSelector';
import CandidateList from './CandidateList';
import apiClient from '../../api/client';
import useDebounce from '../../hooks/useDebounce';
import Spinner from '../ui/Spinner';
import Button from '../ui/Button';

const MatchingScreen = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: '', location: '', seniority: '', minScore: 0 });
  const [sortBy, setSortBy] = useState('score');
  const [jobPanelOpen, setJobPanelOpen] = useState(window.innerWidth >= 1024);

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    if (selectedJob) fetchMatches();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob, debouncedSearch, filters.location, filters.seniority, filters.minScore, sortBy]);

  const fetchMatches = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const params = {
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.location && { location: filters.location }),
        ...(filters.seniority && { seniority: filters.seniority }),
        ...(filters.minScore > 0 && { minScore: filters.minScore }),
        sortBy,
      };
      const response = await apiClient.get(`/matches/job/${selectedJob._id}`, { params });
      setMatches(response.matches || []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const handleRunMatch = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      await apiClient.post('/matches/recalculate/job/' + selectedJob._id);
      await fetchMatches();
      toast.success('Matching recalculated');
    } catch (error) {
      toast.error(`Failed to run matching: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Left Panel: Job Selector */}
      <div
        className={`${jobPanelOpen ? 'w-72' : 'w-0'} flex-shrink-0 bg-white border-r border-zinc-200 flex flex-col overflow-hidden transition-[width] duration-200`}
      >
        <div className="px-4 py-3 border-b border-zinc-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-zinc-700">Select Job</h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar min-w-[288px]">
          <JobSelector selectedJob={selectedJob} onSelect={setSelectedJob} />
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header & Filters */}
        <div className="bg-white border-b border-zinc-200 px-5 py-4 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setJobPanelOpen(o => !o)}
                aria-label={jobPanelOpen ? 'Collapse job list' : 'Expand job list'}
                className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0"
              >
                {jobPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              <h2 className="text-sm font-semibold text-zinc-800 truncate">
                {selectedJob ? `Matches — ${selectedJob.title}` : 'Select a job to view matches'}
              </h2>
            </div>
            {selectedJob && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                loading={loading}
                onClick={handleRunMatch}
              >
                Run Match
              </Button>
            )}
          </div>

          {selectedJob && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={e => handleFilterChange('search', e.target.value)}
                    placeholder="Search candidates…"
                    className="w-full pl-9 pr-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <select
                  value={filters.location}
                  onChange={e => handleFilterChange('location', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Locations</option>
                  <option>Remote</option>
                  <option>New York</option>
                  <option>San Francisco</option>
                  <option>London</option>
                  <option>Toronto</option>
                </select>
                <select
                  value={filters.seniority}
                  onChange={e => handleFilterChange('seniority', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="">All Seniority</option>
                  <option>Entry</option>
                  <option>Mid</option>
                  <option>Senior</option>
                  <option>Lead</option>
                  <option>Principal</option>
                </select>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="score">Sort by Score</option>
                  <option value="recency">Sort by Recency</option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-xs text-zinc-600">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                Min Score:
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={e => handleFilterChange('minScore', parseInt(e.target.value))}
                  aria-label="Minimum match score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={filters.minScore}
                  className="w-28 accent-brand-600"
                />
                <span className="font-semibold text-zinc-800 tabular-nums w-8">{filters.minScore}%</span>
              </label>
            </>
          )}
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {!selectedJob ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-400">Select a job from the left panel to view matching candidates</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner size="lg" />
            </div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-zinc-400">No matches found. Try adjusting filters or click Run Match.</p>
            </div>
          ) : (
            <CandidateList matches={matches} job={selectedJob} />
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingScreen;
