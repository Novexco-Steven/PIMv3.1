import React from 'react'
import { 
  Package, 
  Tags, 
  Settings,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react'

function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-semibold text-gray-900">1,234</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-500 ml-1">12% increase</span>
            <span className="text-gray-500 ml-1">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Tags className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">48</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-green-500 ml-1">4 new</span>
            <span className="text-gray-500 ml-1">categories this week</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attributes</p>
              <p className="text-2xl font-semibold text-gray-900">156</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-blue-500 ml-1">Last updated</span>
            <span className="text-gray-500 ml-1">2 days ago</span>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              icon: <Package className="h-5 w-5 text-blue-500" />,
              message: "New product 'Wireless Headphones' added",
              time: "2 hours ago"
            },
            {
              icon: <Tags className="h-5 w-5 text-purple-500" />,
              message: "Category 'Electronics' updated",
              time: "4 hours ago"
            },
            {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              message: "Missing attributes detected in 3 products",
              time: "6 hours ago"
            }
          ].map((activity, index) => (
            <div key={index} className="px-6 py-4 flex items-center">
              <div className="flex-shrink-0">{activity.icon}</div>
              <div className="ml-4 flex-1">
                <p className="text-sm text-gray-900">{activity.message}</p>
                <p className="text-sm text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard