import { useState } from 'react'
import { apiService } from '../services/api'
import toast from 'react-hot-toast'
import { Eye, Users, MessageSquare, Database, BarChart3, RefreshCw } from 'lucide-react'

export default function Admin() {
  const [token, setToken] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState('stats')
  const [stats, setStats] = useState<any>(null)
  const [results, setResults] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleLogin = () => {
    if (!token.trim()) {
      toast.error('Please enter admin token')
      return
    }
    setAuthenticated(true)
    loadStats()
  }

  const loadStats = async () => {
    setLoading(true)
    try {
      const statsData = await apiService.admin.getStats(token)
      setStats(statsData)
    } catch (error) {
      toast.error('Failed to load stats')
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const loadResults = async () => {
    setLoading(true)
    try {
      const resultsData = await apiService.admin.getResults(token, 50)
      setResults(resultsData)
    } catch (error) {
      toast.error('Failed to load results')
    } finally {
      setLoading(false)
    }
  }

  const loadFeedback = async () => {
    setLoading(true)
    try {
      const feedbackData = await apiService.admin.getFeedback(token, 50)
      setFeedback(feedbackData)
    } catch (error) {
      toast.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    if (tab === 'results' && results.length === 0) {
      loadResults()
    } else if (tab === 'feedback' && feedback.length === 0) {
      loadFeedback()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Login
              </h1>
              <p className="text-gray-600">
                Enter admin token to access the dashboard
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Token
                </label>
                <input
                  type="password"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="input-field"
                  placeholder="Enter admin token"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage and monitor the Which Character Are You application</p>
          </div>
          <button
            onClick={() => {
              setAuthenticated(false)
              setToken('')
            }}
            className="btn-secondary"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'stats', label: 'Statistics', icon: BarChart3 },
              { id: 'results', label: 'Quiz Results', icon: Eye },
              { id: 'feedback', label: 'Amritanshu Feedback', icon: MessageSquare },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleTabChange(id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Results</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_results || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Feedback Entries</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_feedback || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <Database className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Media Mappings</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_media_mappings || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <Users className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Characters</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_characters || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <Database className="w-8 h-8 text-primary-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Questions</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.total_questions || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {stats?.universes && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Universes</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.universes.map((universe: string) => (
                    <span
                      key={universe}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {universe}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Recent Quiz Results</h3>
              <button
                onClick={loadResults}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Universes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Answers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Media
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.universes?.join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.answers?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(result.songs?.length || 0) + (result.movies?.length || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(result.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-gray-900">Amritanshu Feedback</h3>
              <button
                onClick={loadFeedback}
                disabled={loading}
                className="btn-secondary disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="space-y-4">
              {feedback.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <span className="text-sm text-gray-500">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="mb-2">
                    <span className="inline-block px-2 py-1 bg-primary-100 text-primary-800 rounded text-sm">
                      {item.selected_trait}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-gray-700 text-sm">{item.note}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
