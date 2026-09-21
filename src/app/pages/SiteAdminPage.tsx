import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Building2,
  Users,
  TrendingUp,
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Key,
  BarChart3,
  BookOpen,
  FileText,
  Download,
} from 'lucide-react';
import { Header } from '../components/Header';

interface Tenant {
  id: string;
  name: string;
  email: string;
  createdDate: string;
  totalLicenses: number;
  usedLicenses: number;
  coursesPublished: number;
  coursesDraft: number;
  status: 'active' | 'inactive';
}

interface AnalyticsData {
  totalTenants: number;
  totalCourses: number;
  totalLicenses: number;
  usedLicenses: number;
  recentActivity: {
    tenant: string;
    action: string;
    date: string;
  }[];
}

// Mock data
const MOCK_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Acme Corporation',
    email: 'admin@acme.com',
    createdDate: '2026-01-15',
    totalLicenses: 50,
    usedLicenses: 32,
    coursesPublished: 28,
    coursesDraft: 4,
    status: 'active',
  },
  {
    id: 'tenant-2',
    name: 'TechCo Industries',
    email: 'admin@techco.com',
    createdDate: '2026-02-10',
    totalLicenses: 30,
    usedLicenses: 18,
    coursesPublished: 15,
    coursesDraft: 3,
    status: 'active',
  },
  {
    id: 'tenant-3',
    name: 'Global Learning Ltd',
    email: 'admin@globallearning.com',
    createdDate: '2026-03-05',
    totalLicenses: 100,
    usedLicenses: 75,
    coursesPublished: 68,
    coursesDraft: 7,
    status: 'active',
  },
];

const MOCK_ANALYTICS: AnalyticsData = {
  totalTenants: 3,
  totalCourses: 111,
  totalLicenses: 180,
  usedLicenses: 125,
  recentActivity: [
    { tenant: 'Acme Corporation', action: 'Published "Safety Training 101"', date: '2 hours ago' },
    { tenant: 'TechCo Industries', action: 'Created new course draft', date: '5 hours ago' },
    { tenant: 'Global Learning Ltd', action: 'Updated license allocation', date: '1 day ago' },
    { tenant: 'Acme Corporation', action: 'Downloaded SCORM package', date: '1 day ago' },
    { tenant: 'TechCo Industries', action: 'Published "Leadership Skills"', date: '2 days ago' },
  ],
};

export function SiteAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'analytics'>('overview');
  const [tenants, setTenants] = useState<Tenant[]>(MOCK_TENANTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateTenantModal, setShowCreateTenantModal] = useState(false);
  const [showEditLicenseModal, setShowEditLicenseModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [newTenant, setNewTenant] = useState({
    name: '',
    email: '',
    licenses: 10,
  });

  const filteredTenants = tenants.filter((tenant) =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenant = () => {
    const tenant: Tenant = {
      id: `tenant-${Date.now()}`,
      name: newTenant.name,
      email: newTenant.email,
      createdDate: new Date().toISOString().split('T')[0],
      totalLicenses: newTenant.licenses,
      usedLicenses: 0,
      coursesPublished: 0,
      coursesDraft: 0,
      status: 'active',
    };
    setTenants([...tenants, tenant]);
    setShowCreateTenantModal(false);
    setNewTenant({ name: '', email: '', licenses: 10 });
  };

  const handleUpdateLicenses = (tenantId: string, newLicenses: number) => {
    setTenants(
      tenants.map((t) =>
        t.id === tenantId ? { ...t, totalLicenses: newLicenses } : t
      )
    );
    setShowEditLicenseModal(false);
    setSelectedTenant(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Administration</h1>
          <p className="text-gray-600">Manage tenants, licenses, and view system analytics</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'tenants'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Building2 className="w-5 h-5" />
              Tenant Management
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Analytics
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {MOCK_ANALYTICS.totalTenants}
                </h3>
                <p className="text-sm text-gray-600">Total Tenants</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {MOCK_ANALYTICS.totalCourses}
                </h3>
                <p className="text-sm text-gray-600">Total Courses</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Key className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {MOCK_ANALYTICS.totalLicenses}
                </h3>
                <p className="text-sm text-gray-600">Total Licenses</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {MOCK_ANALYTICS.usedLicenses}
                </h3>
                <p className="text-sm text-gray-600">Licenses In Use</p>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {MOCK_ANALYTICS.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{activity.tenant}</p>
                      <p className="text-sm text-gray-600">{activity.action}</p>
                    </div>
                    <span className="text-xs text-gray-500">{activity.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tenants Tab */}
        {activeTab === 'tenants' && (
          <div className="space-y-6">
            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={() => setShowCreateTenantModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                Create Tenant
              </button>
            </div>

            {/* Tenants Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Licenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Courses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                          <p className="text-sm text-gray-500">{tenant.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(tenant.createdDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-900 font-medium">
                                {tenant.usedLicenses} / {tenant.totalLicenses}
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  tenant.usedLicenses / tenant.totalLicenses > 0.8
                                    ? 'bg-orange-500'
                                    : 'bg-green-500'
                                }`}
                                style={{
                                  width: `${(tenant.usedLicenses / tenant.totalLicenses) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">
                            {tenant.coursesPublished} published
                          </p>
                          <p className="text-gray-500">{tenant.coursesDraft} drafts</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTenant(tenant);
                              setShowEditLicenseModal(true);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Licenses"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit Tenant"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Tenant"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* License Utilization */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  License Utilization by Tenant
                </h2>
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{tenant.name}</span>
                        <span className="text-sm text-gray-600">
                          {tenant.usedLicenses}/{tenant.totalLicenses}
                        </span>
                      </div>
                      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{
                            width: `${(tenant.usedLicenses / tenant.totalLicenses) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Course Distribution
                </h2>
                <div className="space-y-4">
                  {tenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                        <p className="text-xs text-gray-500">
                          {tenant.coursesPublished + tenant.coursesDraft} total courses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-green-600">
                          {tenant.coursesPublished} published
                        </p>
                        <p className="text-xs text-gray-500">{tenant.coursesDraft} drafts</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* System Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">System Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {tenants.reduce((sum, t) => sum + t.coursesPublished, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Published Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {tenants.reduce((sum, t) => sum + t.coursesDraft, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Draft Courses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {tenants.reduce((sum, t) => sum + t.totalLicenses, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Licenses</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {tenants.reduce((sum, t) => sum + t.usedLicenses, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Used Licenses</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {showCreateTenantModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Create New Tenant</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tenant Name
                </label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  placeholder="Enter tenant name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <input
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  placeholder="admin@company.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  License Allocation
                </label>
                <input
                  type="number"
                  value={newTenant.licenses}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, licenses: parseInt(e.target.value) || 0 })
                  }
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateTenantModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTenant}
                disabled={!newTenant.name || !newTenant.email || newTenant.licenses < 1}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Tenant
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit License Modal */}
      {showEditLicenseModal && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl w-full max-w-md p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Edit License Allocation
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Tenant: <span className="font-medium text-gray-900">{selectedTenant.name}</span>
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Licenses
                </label>
                <input
                  type="number"
                  defaultValue={selectedTenant.totalLicenses}
                  min={selectedTenant.usedLicenses}
                  id="license-input"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Currently using {selectedTenant.usedLicenses} licenses
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditLicenseModal(false);
                  setSelectedTenant(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const input = document.getElementById('license-input') as HTMLInputElement;
                  handleUpdateLicenses(selectedTenant.id, parseInt(input.value));
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Update Licenses
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
