import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutGrid, Package, Tags, Settings, LogOut, Boxes, Building2, Truck, FileText, Book, FolderTree, Users, Shield, Activity, User, Sliders, Warehouse, MapPin, Boxes as BoxesStacked, DollarSign, Calculator, Tag, Calendar, Percent } from 'lucide-react'
import { RoleCheck } from './user/RoleCheck'

export function Layout() {
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 px-3 py-4 flex flex-col">
          <div className="flex items-center gap-2 px-3 mb-8">
            <Boxes className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-semibold text-gray-900">PIM System</span>
          </div>
          
          <nav className="flex-1 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <LayoutGrid className="mr-3 h-5 w-5" />
              Dashboard
            </NavLink>

            {/* Product Inventory */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product Inventory
              </h3>
              <div className="mt-2 space-y-1">
                <NavLink
                  to="/servicing-areas"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <MapPin className="mr-3 h-5 w-5" />
                  Servicing Areas
                </NavLink>

                <NavLink
                  to="/warehouses"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Warehouse className="mr-3 h-5 w-5" />
                  Warehouses
                </NavLink>

                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <BoxesStacked className="mr-3 h-5 w-5" />
                  Inventory
                </NavLink>
              </div>
            </div>

            {/* Product Pricing */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product Pricing
              </h3>
              <div className="mt-2 space-y-1">
                <NavLink
                  to="/pricing"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <DollarSign className="mr-3 h-5 w-5" />
                  Overview
                </NavLink>

                <NavLink
                  to="/pricing/supplier"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Truck className="mr-3 h-5 w-5" />
                  Supplier Pricing
                </NavLink>

                <NavLink
                  to="/pricing/policies"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Tag className="mr-3 h-5 w-5" />
                  Policies
                </NavLink>

                <NavLink
                  to="/pricing/promotions"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Percent className="mr-3 h-5 w-5" />
                  Promotions
                </NavLink>

                <NavLink
                  to="/pricing/calculations"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Calculator className="mr-3 h-5 w-5" />
                  Calculations
                </NavLink>
              </div>
            </div>

            {/* Product Management */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Product Management
              </h3>
              <div className="mt-2 space-y-1">
                <NavLink
                  to="/products"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Package className="mr-3 h-5 w-5" />
                  Products
                </NavLink>

                <NavLink
                  to="/categories"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Tags className="mr-3 h-5 w-5" />
                  Categories
                </NavLink>

                <NavLink
                  to="/attributes"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Settings className="mr-3 h-5 w-5" />
                  Attributes
                </NavLink>

                <NavLink
                  to="/specifications"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <FileText className="mr-3 h-5 w-5" />
                  Specifications
                </NavLink>

                <NavLink
                  to="/manufacturers"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Building2 className="mr-3 h-5 w-5" />
                  Manufacturers
                </NavLink>

                <NavLink
                  to="/suppliers"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Truck className="mr-3 h-5 w-5" />
                  Suppliers
                </NavLink>
              </div>
            </div>

            {/* Catalog Management */}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Catalogs
              </h3>
              <div className="mt-2 space-y-1">
                <NavLink
                  to="/catalogs"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <Book className="mr-3 h-5 w-5" />
                  Catalogs
                </NavLink>

                <NavLink
                  to="/catalog-categories"
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  <FolderTree className="mr-3 h-5 w-5" />
                  Categories
                </NavLink>
              </div>
            </div>

            {/* User Management */}
            <RoleCheck role="admin">
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administration
                </h3>
                <div className="mt-2 space-y-1">
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Users className="mr-3 h-5 w-5" />
                    Users
                  </NavLink>

                  <NavLink
                    to="/roles"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Shield className="mr-3 h-5 w-5" />
                    Roles
                  </NavLink>

                  <NavLink
                    to="/activity-logs"
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Activity className="mr-3 h-5 w-5" />
                    Activity Logs
                  </NavLink>
                </div>
              </div>
            </RoleCheck>
          </nav>

          <div className="border-t border-gray-200 pt-4 mt-4">
            <div className="px-3 mb-2">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {user?.profile?.avatar_url ? (
                    <img
                      src={user.profile.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.profile?.first_name} {user?.profile?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              {user && (
                <>
                  <NavLink
                    to={`/users/${user.id}/profile`}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <User className="mr-3 h-4 w-4" />
                    Profile
                  </NavLink>

                  <NavLink
                    to={`/users/${user.id}/preferences`}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Sliders className="mr-3 h-4 w-4" />
                    Preferences
                  </NavLink>
                </>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 w-full"
              >
                <LogOut className="mr-3 h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}