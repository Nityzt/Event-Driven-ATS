// src/components/matching/MatchingScreen.jsx
import { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, TrendingDown } from 'lucide-react';
import JobSelector from './JobSelector';
import CandidateList from './CandidateList';
import apiClient from '../../api/client';
import useDebounce from '../../hooks/useDebounce';

const MatchingScreen = () => {
  const [selectedJob, setSelectedJob] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    location: '',
    seniority: '',
    minScore: 0
  });
  const [sortBy, setSortBy] = useState('score'); // score | recency

  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    if (selectedJob) {
      fetchMatches();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob, debouncedSearch, filters.location, filters.seniority, filters.minScore, sortBy]);

  const fetchMatches = async () => {
    if (!selectedJob) return;

    setLoading(true);
    try {
      const params = {
        jobId: selectedJob._id,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.location && { location: filters.location }),
        ...(filters.seniority && { seniority: filters.seniority }),
        ...(filters.minScore > 0 && { minScore: filters.minScore }),
        sortBy
      };

      const response = await apiClient.get(`/matches/job/${selectedJob._id}`, { params });
      setMatches(response.data?.matches || []);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRunMatch = async () => {
    if (!selectedJob) return;

    setLoading(true);
    try {
      await apiClient.post('/matches/recalculate/job/' + selectedJob._id);
      await fetchMatches();
    } catch (error) {
      console.error('Failed to run matching:', error);
      alert(`Failed to run matching: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel: Job Selector */}
      <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Select Job</h2>
        </div>
        <JobSelector
          selectedJob={selectedJob}
          onSelect={setSelectedJob}
        />
      </div>

      {/* Right Panel: Candidates & Filters */}
      <div className="flex-1 flex flex-col">
        {/* Header & Filters */}
        <div className="bg-white border-b border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">
              {selectedJob ? `Matching for: ${selectedJob.title}` : 'Select a job to view matches'}
            </h2>
            {selectedJob && (
              <button
                onClick={handleRunMatch}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Running...' : 'Run Match'}
              </button>
            )}
          </div>

          {selectedJob && (
            <div className="grid grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search candidates..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Location Filter */}
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Locations</option>
                <option value="Remote">Remote</option>
                <option value="New York">New York</option>
                <option value="San Francisco">San Francisco</option>
                <option value="London">London</option>
                <option value="Toronto">Toronto</option>
              </select>

              {/* Seniority Filter */}
              <select
                value={filters.seniority}
                onChange={(e) => handleFilterChange('seniority', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Seniority</option>
                <option value="Entry">Entry</option>
                <option value="Mid">Mid</option>
                <option value="Senior">Senior</option>
                <option value="Lead">Lead</option>
                <option value="Principal">Principal</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="score">Sort by Score</option>
                <option value="recency">Sort by Recency</option>
              </select>
            </div>
          )}

          {selectedJob && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Min Score:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.minScore}
                  onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="font-medium text-gray-800">{filters.minScore}%</span>
              </label>
            </div>
          )}
        </div>

        {/* Candidate List */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedJob ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Select a job to view matching candidates</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : matches.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No matches found. Try adjusting filters or run matching.</p>
            </div>
          ) : (
            <CandidateList
              matches={matches}
              job={selectedJob}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchingScreen;