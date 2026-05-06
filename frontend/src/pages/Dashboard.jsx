import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Users, FileText, Target, TrendingUp, Calendar, Activity } from 'lucide-react';
import { jobsAPI, candidatesAPI, applicationsAPI, workflowsAPI } from '../api';


const Dashboard = () => {
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalCandidates: 0,
    totalApplications: 0,
    activeWorkflows: 0
  });
  const [recentApplications, setRecentApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [jobs, candidates, applications, workflows] = await Promise.all([
        jobsAPI.getAll(),
        candidatesAPI.getAll(),
        applicationsAPI.getAll({ limit: 10, sort: '-createdAt' }),
        workflowsAPI.getAll()
      ]);

      setStats({
        totalJobs:         jobs.data?.pagination?.total         || jobs.data?.jobs?.length         || 0,
        totalCandidates:   candidates.data?.pagination?.total   || candidates.data?.candidates?.length || 0,
        totalApplications: applications.data?.pagination?.total || applications.data?.applications?.length || 0,
        activeWorkflows:   (workflows.data || []).filter(w => w.enabled).length
      });

      setRecentApplications(applications.data?.applications?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      icon: Briefcase,
      color: 'bg-blue-500',
      link: '/jobs'
    },
    {
      title: 'Total Candidates',
      value: stats.totalCandidates,
      icon: Users,
      color: 'bg-green-500',
      link: '/candidates'
    },
    {
      title: 'Applications',
      value: stats.totalApplications,
      icon: FileText,
      color: 'bg-purple-500',
      link: '/applications'
    },
    {
      title: 'Active Matches',
      value: '—',
      icon: Target,
      color: 'bg-orange-500',
      link: '/matches'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow p-6 border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>View all</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Applications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Applications
            </h2>
            <Link to="/applications" className="text-sm text-blue-600 hover:text-blue-800">
              View all →
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent applications</p>
          ) : (
            <div className="space-y-3">
              {recentApplications.map((app) => (
                <div
                  key={app._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {app.candidate?.name || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {app.job?.title || 'Unknown Position'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      app.stage === 'Hired' ? 'bg-green-100 text-green-800' :
                      app.stage === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {app.stage}
                    </span>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/jobs"
              className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded">
                  <Briefcase className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Post New Job</p>
                  <p className="text-sm text-gray-600">Add a new job opening</p>
                </div>
              </div>
            </Link>

            <Link
              to="/candidates"
              className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-green-600 p-2 rounded">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Add Candidate</p>
                  <p className="text-sm text-gray-600">Register a new candidate</p>
                </div>
              </div>
            </Link>

            <Link
              to="/matches"
              className="block p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Run Matching</p>
                  <p className="text-sm text-gray-600">Find candidate matches</p>
                </div>
              </div>
            </Link>

            <Link
              to="/workflows"
              className="block p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 p-2 rounded">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">Create Workflow</p>
                  <p className="text-sm text-gray-600">Automate your processes</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
