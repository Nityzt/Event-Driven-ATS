import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Settings, LogOut, User, ChevronDown, Briefcase, X, Menu } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { applicationsAPI, candidatesAPI, jobsAPI } from '../api/index';
import Badge, { stageToBadgeVariant } from './ui/Badge';
import Spinner from './ui/Spinner';
import { timeAgo } from '../lib/utils';

export const Navbar = ({ setSidebarOpen }) => {
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

  useEffect(() => {
    applicationsAPI.getAll({ limit: 5, sort: '-createdAt' })
      .then(res => setRecentApps(res?.data?.applications || res?.applications || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearchDropdown(false);
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
    } catch { /* silently ignore */ }
    finally { setSearching(false); }
  }, []);

  function handleSearchChange(e) {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 300);
  }

  function handleSearchKeyDown(e) {
    if (e.key === 'Escape') { setShowSearchDropdown(false); setSearchQuery(''); }
  }

  function handleLogout() { logout(); navigate('/login'); }

  const hasResults = searchResults.candidates.length > 0 || searchResults.jobs.length > 0;
  const initial = user?.name?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="bg-white border-b border-zinc-200 px-4 lg:px-6 h-16 flex items-center flex-shrink-0">
      <div className="flex items-center gap-3 w-full">

        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden p-2 -ml-1 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-lg relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => hasResults && setShowSearchDropdown(true)}
              placeholder="Search candidates, jobs…"
              aria-label="Search candidates and jobs"
              className="w-full pl-9 pr-4 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-colors"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner size="sm" />
              </span>
            )}
          </div>

          {showSearchDropdown && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-zinc-200 rounded-xl shadow-modal z-50 max-h-80 overflow-y-auto animate-slide-up">
              {!hasResults ? (
                <p className="px-4 py-6 text-sm text-zinc-400 text-center">No results for "{searchQuery}"</p>
              ) : (
                <>
                  {searchResults.candidates.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-2xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">Candidates</p>
                      {searchResults.candidates.map(c => (
                        <button
                          key={c._id}
                          onClick={() => { navigate('/candidates'); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-semibold flex-shrink-0">
                            {c.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-800">{c.name}</p>
                            <p className="text-xs text-zinc-400">{c.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.jobs.length > 0 && (
                    <div>
                      <p className="px-4 py-2 text-2xs font-semibold text-zinc-400 uppercase tracking-wider border-b border-zinc-100">Jobs</p>
                      {searchResults.jobs.map(j => (
                        <button
                          key={j._id}
                          onClick={() => { navigate('/jobs'); setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="w-full px-4 py-2.5 text-left hover:bg-zinc-50 flex items-center gap-3 transition-colors"
                        >
                          <Briefcase className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-zinc-800">{j.title}</p>
                            <p className="text-xs text-zinc-400">{j.location} · {j.seniority}</p>
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

        {/* Right section */}
        <div className="flex items-center gap-1 ml-auto">

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(v => !v)}
              aria-label="View recent activity"
              className="relative p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {recentApps.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-modal z-50 animate-slide-up">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
                  <h3 className="text-sm font-semibold text-zinc-800">Recent Activity</h3>
                  <button
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                    className="text-zinc-400 hover:text-zinc-600 p-1 rounded transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {recentApps.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-zinc-400 text-center">No recent activity</p>
                ) : (
                  <div className="divide-y divide-zinc-50">
                    {recentApps.map(app => (
                      <div key={app._id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-zinc-800 truncate">
                              {app.candidateId?.name || app.candidate?.name || 'Unknown'}
                            </p>
                            <p className="text-xs text-zinc-400 truncate">
                              {app.jobId?.title || app.job?.title || 'Unknown Job'}
                            </p>
                          </div>
                          <Badge variant={stageToBadgeVariant(app.stage)} size="sm">
                            {app.stage}
                          </Badge>
                        </div>
                        <p className="text-xs text-zinc-400 mt-1">{timeAgo(app.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-4 py-2.5 border-t border-zinc-100">
                  <button
                    onClick={() => { navigate('/applications'); setShowNotifications(false); }}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors"
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
            aria-label="Go to profile settings"
            className="p-2 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="Open user menu"
              aria-expanded={showUserMenu}
              className="flex items-center gap-2.5 pl-2.5 pr-2 py-1.5 hover:bg-zinc-100 rounded-lg transition-colors ml-1"
            >
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {initial}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-medium text-zinc-800 leading-tight">{user?.name || 'User'}</p>
                <p className="text-xs text-zinc-400 leading-tight">{user?.role || 'Member'}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-modal border border-zinc-200 py-1 z-50 animate-slide-up">
                <button
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 flex items-center gap-2 transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile
                </button>
                <div className="border-t border-zinc-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
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
