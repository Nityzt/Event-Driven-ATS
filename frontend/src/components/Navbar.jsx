import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, User, ChevronDown, Briefcase, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, candidatesAPI, jobsAPI } from '../api/index';

const STAGE_COLORS = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-purple-100 text-purple-700',
  Offer: 'bg-green-100 text-green-700',
  Hired: 'bg-emerald-100 text-emerald-700',
  Rejected: 'bg-red-100 text-red-700',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [recentApps, setRecentApps] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ candidates: [], jobs: [] });
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searching, setSearching] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Fetch recent applications once for notification panel
  useEffect(() => {
    applicationsAPI.getAll({ limit: 5, sort: '-createdAt' })
      .then(res => setRecentApps(res?.data?.applications || res?.applications || []))
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const runSearch = useCallback(async (q) => {
    if (q.length < 2) {
      setSearchResults({ candidates: [], jobs: [] });
      setShowSearchDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const [cRes, jRes] = await Promise.all([
        candidatesAPI.getAll({ search: q, limit: 5 }),
        jobsAPI.getAll({ search: q, limit: 5 }),
      ]);
      setSearchResults({
        candidates: cRes?.data?.candidates || cRes?.candidates || [],
        jobs: jRes?.data?.jobs || jRes?.jobs || [],
      });
      setShowSearchDropdown(true);
    } catch {
      // silently ignore
    } finally {
      setSearching(false);
    }
  }, []);

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 300);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setSearchQuery('');
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const hasResults = searchResults.candidates.length > 0 || searchResults.jobs.length > 0;

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">

        {/* Search */}
        <div className="flex-1 max-w-lg relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => hasResults && setShowSearchDropdown(true)}
              placeholder="Search candidates, jobs..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searching && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {showSearchDropdown && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {!hasResults ? (
                <p className="px-4 py-3 text-sm text-gray-500">No results for "{searchQuery}"</p>
              ) : (
                <>
                  {searchResults.candidates.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Candidates</p>
                      {searchResults.candidates.map(c => (
                        <button
                          key={c._id}
                          onClick={() => { navigate('/candidates'); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-semibold flex-shrink-0">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">{c.name}</p>
                            <p className="text-xs text-gray-500">{c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.jobs.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">Jobs</p>
                      {searchResults.jobs.map(j => (
                        <button
                          key={j._id}
                          onClick={() => { navigate('/jobs'); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                        >
                          <Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{j.title}</p>
                            <p className="text-xs text-gray-500">{j.location} · {j.seniority}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {recentApps.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">Recent Activity</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {recentApps.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-gray-500 text-center">No recent activity</p>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {recentApps.map(app => (
                      <div key={app._id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {app.candidateId?.name || app.candidate?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {app.jobId?.title || app.job?.title || 'Unknown Job'}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STAGE_COLORS[app.stage] || 'bg-gray-100 text-gray-600'}`}>
                            {app.stage}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{timeAgo(app.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 py-2 border-t border-gray-100">
                  <button
                    onClick={() => { navigate('/applications'); setShowNotifications(false); }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View all applications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate('/profile')}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 pl-3 pr-2 py-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-gray-800">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <div className="border-t border-gray-200 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
