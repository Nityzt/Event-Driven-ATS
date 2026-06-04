import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, FileText, Target, ArrowRight, Activity, Workflow, Shield } from 'lucide-react';
import { jobsAPI, candidatesAPI, applicationsAPI, workflowsAPI } from '../api';
import Card from '../components/ui/Card';
import Badge, { stageToBadgeVariant } from '../components/ui/Badge';
import { StatCardSkeleton } from '../components/ui/Skeleton';
import PageHeader from '../components/ui/PageHeader';
import { useAuth } from '../contexts/AuthContext';

// ── constants ─────────────────────────────────────────────────────────────────

const STAGE_ORDER = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

const STAGE_META = {
  Applied:   { bar: 'bg-blue-400' },
  Screening: { bar: 'bg-amber-400' },
  Interview: { bar: 'bg-purple-400' },
  Offer:     { bar: 'bg-brand-500' },
  Hired:     { bar: 'bg-green-500' },
  Rejected:  { bar: 'bg-zinc-300' },
};

const ACCENT = {
  brand:  { icon: 'bg-brand-50 text-brand-600',   stripe: 'bg-brand-500' },
  green:  { icon: 'bg-green-50 text-green-600',   stripe: 'bg-green-500' },
  purple: { icon: 'bg-purple-50 text-purple-600', stripe: 'bg-purple-500' },
  amber:  { icon: 'bg-amber-50 text-amber-600',   stripe: 'bg-amber-500' },
};

const AVATAR_PALETTE = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-brand-100 text-brand-700',
  'bg-orange-100 text-orange-700',
];

const QUICK_ACTIONS = [
  { to: '/jobs',         icon: Briefcase, label: 'Post Job',      color: 'bg-brand-600' },
  { to: '/candidates',   icon: Users,     label: 'Candidates',    color: 'bg-green-600' },
  { to: '/matches',      icon: Target,    label: 'Matching',      color: 'bg-purple-600' },
  { to: '/workflows',    icon: Workflow,  label: 'Workflows',     color: 'bg-amber-600' },
  { to: '/applications', icon: Activity,  label: 'Applications',  color: 'bg-teal-600' },
  { to: '/audit-logs',   icon: Shield,    label: 'Audit Logs',    color: 'bg-zinc-600' },
];

// ── helpers ───────────────────────────────────────────────────────────────────

function nameToAvatarColor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

function timeAgo(iso) {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60)     return 'just now';
  if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
  if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ── component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { hasRole } = useAuth();
  const [stats, setStats]                       = useState({ totalJobs: 0, totalCandidates: 0, totalApplications: 0, activeWorkflows: 0 });
  const [recentApplications, setRecentApplications] = useState([]);
  const [stageDist, setStageDist]               = useState({});
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [jobs, candidates, applications, workflows] = await Promise.all([
          jobsAPI.getAll(),
          candidatesAPI.getAll(),
          applicationsAPI.getAll({ limit: 50, sort: '-createdAt' }),
          workflowsAPI.getAll(),
        ]);

        const allApps = applications.data?.applications || [];

        // Stage distribution across fetched apps
        const dist = Object.fromEntries(STAGE_ORDER.map(s => [s, 0]));
        allApps.forEach(a => { if (dist[a.stage] !== undefined) dist[a.stage]++; });

        setStats({
          totalJobs:         jobs.data?.pagination?.total           || jobs.data?.jobs?.length           || 0,
          totalCandidates:   candidates.data?.pagination?.total     || candidates.data?.candidates?.length || 0,
          totalApplications: applications.data?.pagination?.total   || allApps.length                    || 0,
          activeWorkflows:   (workflows.data || []).filter(w => w.enabled).length,
        });
        setRecentApplications(allApps.slice(0, 5));
        setStageDist(dist);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const statCards = [
    { title: 'Open Jobs',        value: stats.totalJobs,         icon: Briefcase, link: '/jobs',         accent: 'brand'  },
    { title: 'Candidates',       value: stats.totalCandidates,   icon: Users,     link: '/candidates',   accent: 'green'  },
    { title: 'Applications',     value: stats.totalApplications, icon: FileText,  link: '/applications', accent: 'purple' },
    { title: 'Active Workflows', value: stats.activeWorkflows,   icon: Workflow,  link: '/workflows',    accent: 'amber'  },
  ];

  const totalInDist = Object.values(stageDist).reduce((a, b) => a + b, 0);

  const visibleActions = hasRole?.(['Admin', 'Recruiter'])
    ? QUICK_ACTIONS
    : QUICK_ACTIONS.filter(a => !['/workflows', '/audit-logs'].includes(a.to));

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard"
        subtitle="Recruitment overview"
      />

      {/* ── Stat cards ─────────────────────────────────────────────────────── */}
      {loading ? (
        <StatCardSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(({ title, value, icon: Icon, link, accent }) => {
            const ac = ACCENT[accent];
            return (
              <Link key={title} to={link} className="group">
                <div className="relative bg-white rounded-2xl border border-zinc-100 shadow-card hover:shadow-card-hover transition-shadow duration-200 overflow-hidden p-5">
                  {/* Top accent stripe — the identifying mark for each card */}
                  <div className={`absolute inset-x-0 top-0 h-[3px] ${ac.stripe}`} />

                  <div className="flex items-start justify-between mb-4 mt-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${ac.icon}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-300 group-hover:text-zinc-500 group-hover:translate-x-0.5 transition-all mt-1" />
                  </div>

                  <p className="text-[2rem] font-bold text-zinc-900 tabular-nums leading-none">
                    {value.toLocaleString()}
                  </p>
                  <p className="mt-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">
                    {title}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Pipeline stage distribution ────────────────────────────────────── */}
      {!loading && totalInDist > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-800">Pipeline</h2>
            <span className="text-xs text-zinc-400 tabular-nums">
              {totalInDist} application{totalInDist !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Stacked bar */}
          <div className="flex rounded-full overflow-hidden h-2.5 mb-4 bg-zinc-100">
            {STAGE_ORDER.map(stage => {
              const count = stageDist[stage] || 0;
              if (!count) return null;
              const pct = (count / totalInDist) * 100;
              return (
                <div
                  key={stage}
                  className={`h-full ${STAGE_META[stage].bar} transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                  title={`${stage}: ${count}`}
                />
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {STAGE_ORDER.map(stage => {
              const count = stageDist[stage] || 0;
              if (!count) return null;
              return (
                <div key={stage} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${STAGE_META[stage].bar}`} />
                  <span className="text-xs text-zinc-500">{stage}</span>
                  <span className="text-xs font-semibold text-zinc-700 tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Main grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Recent Applications */}
        <Card className="lg:col-span-2" padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-500" />
              Recent Applications
            </h2>
            <Link
              to="/applications"
              className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-0.5 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="skeleton-shimmer h-12 rounded-lg" />)}
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <FileText className="w-8 h-8 text-zinc-200 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No applications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-50">
              {recentApplications.map(app => {
                const name = app.candidate?.name || app.candidateId?.name || '?';
                return (
                  <li
                    key={app._id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50/70 transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${nameToAvatarColor(name)}`}>
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-800 truncate">{name}</p>
                      <p className="text-xs text-zinc-400 truncate">
                        {app.job?.title || app.jobId?.title || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={stageToBadgeVariant(app.stage)} size="sm">
                        {app.stage}
                      </Badge>
                      <span className="text-xs text-zinc-400 hidden sm:block tabular-nums w-16 text-right">
                        {timeAgo(app.createdAt)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* Quick Actions */}
        <Card padding="none">
          <div className="px-5 py-4 border-b border-zinc-100">
            <h2 className="text-sm font-semibold text-zinc-800">Quick Actions</h2>
          </div>
          <div className="p-3 grid grid-cols-2 gap-1.5">
            {visibleActions.map(({ to, icon: Icon, label, color }) => (
              <Link
                key={to}
                to={to}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-zinc-50 transition-colors group"
              >
                <div className={`${color} w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-150`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-800 transition-colors text-center leading-tight">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;
