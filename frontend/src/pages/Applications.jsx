// src/pages/Applications.jsx
import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, Calendar } from 'lucide-react';
import { applicationsAPI } from '../api';
import ApplicationTimeline from '../components/timeline/ApplicationTimeline';
import useDebounce from '../hooks/useDebounce';


const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showTimeline, setShowTimeline] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = debouncedSearch ? { search: debouncedSearch } : {};
      const response = await applicationsAPI.getAll(params);
      setApplications(response.data?.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStageChange = async (applicationId, newStage) => {
    try {
      await applicationsAPI.updateStage(applicationId, newStage);
      setApplications(applications.map(app => 
        app._id === applicationId ? { ...app, stage: newStage } : app
      ));
    } catch (error) {
      alert(`Failed to update stage: ${error.message}`);
    }
  };

  const viewTimeline = (application) => {
    setSelectedApplication(application);
    setShowTimeline(true);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Applications</h1>
      </div>

      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search applications..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {applications.map((app) => (
                <tr key={app._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-800">{app.candidate?.name || 'Unknown'}</div>
                    <div className="text-sm text-gray-500">{app.candidate?.email}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-800">{app.job?.title || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <select
                      value={app.stage}
                      onChange={(e) => handleStageChange(app._id, e.target.value)}
                      className="px-3 py-1 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Applied">Applied</option>
                      <option value="Screening">Screening</option>
                      <option value="Interview">Interview</option>
                      <option value="Offer">Offer</option>
                      <option value="Hired">Hired</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(app.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewTimeline(app)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                      Timeline
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTimeline && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Application Timeline: {selectedApplication.candidate?.name}
              </h2>
              <button
                onClick={() => setShowTimeline(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <ApplicationTimeline applicationId={selectedApplication._id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;