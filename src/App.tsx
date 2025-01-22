import React, { Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

// Import pages directly instead of lazy loading
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Categories from './pages/Categories'
import CategoryDetail from './pages/CategoryDetail'
import Attributes from './pages/Attributes'
import AttributeDetail from './pages/AttributeDetail'
import Specifications from './pages/Specifications'
import SpecificationDetail from './pages/SpecificationDetail'
import Manufacturers from './pages/Manufacturers'
import ManufacturerDetail from './pages/ManufacturerDetail'
import Suppliers from './pages/Suppliers'
import SupplierDetail from './pages/SupplierDetail'
import Catalogs from './pages/Catalogs'
import CatalogDetail from './pages/CatalogDetail'
import CatalogCategories from './pages/CatalogCategories'
import CatalogCategoryDetail from './pages/CatalogCategoryDetail'
import UserProfile from './pages/UserProfile'
import UserPreferences from './pages/UserPreferences'
import Roles from './pages/Roles'
import ActivityLogs from './pages/ActivityLogs'
import Users from './pages/Users'
import ServicingAreas from './pages/ServicingAreas'
import ServicingAreaDetail from './pages/ServicingAreaDetail'
import Warehouses from './pages/Warehouses'
import WarehouseDetail from './pages/WarehouseDetail'
import Inventory from './pages/Inventory'
import InventoryDetail from './pages/InventoryDetail'
import Pricing from './pages/Pricing'
import PricingPolicies from './pages/PricingPolicies'
import PricingPolicyDetail from './pages/PricingPolicyDetail'
import Promotions from './pages/Promotions'
import PromotionDetail from './pages/PromotionDetail'
import SupplierPricing from './pages/SupplierPricing'
import SupplierPricingDetail from './pages/SupplierPricingDetail'
import PricingCalculations from './pages/PricingCalculations'
import PricingCalculationDetail from './pages/PricingCalculationDetail'

// Loading component with error handling
const LoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-sm text-gray-600">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:id" element={<CategoryDetail />} />
              <Route path="/attributes" element={<Attributes />} />
              <Route path="/attributes/:id" element={<AttributeDetail />} />
              <Route path="/specifications" element={<Specifications />} />
              <Route path="/specifications/:id" element={<SpecificationDetail />} />
              <Route path="/manufacturers" element={<Manufacturers />} />
              <Route path="/manufacturers/:id" element={<ManufacturerDetail />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/suppliers/:id" element={<SupplierDetail />} />
              <Route path="/catalogs" element={<Catalogs />} />
              <Route path="/catalogs/:id" element={<CatalogDetail />} />
              <Route path="/catalog-categories" element={<CatalogCategories />} />
              <Route path="/catalog-categories/:id" element={<CatalogCategoryDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id/profile" element={<UserProfile />} />
              <Route path="/users/:id/preferences" element={<UserPreferences />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/activity-logs" element={<ActivityLogs />} />
              <Route path="/servicing-areas" element={<ServicingAreas />} />
              <Route path="/servicing-areas/:id" element={<ServicingAreaDetail />} />
              <Route path="/warehouses" element={<Warehouses />} />
              <Route path="/warehouses/:id" element={<WarehouseDetail />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/inventory/:id" element={<InventoryDetail />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/pricing/policies" element={<PricingPolicies />} />
              <Route path="/pricing/policies/:id" element={<PricingPolicyDetail />} />
              <Route path="/pricing/promotions" element={<Promotions />} />
              <Route path="/pricing/promotions/:id" element={<PromotionDetail />} />
              <Route path="/pricing/supplier" element={<SupplierPricing />} />
              <Route path="/pricing/supplier/:id" element={<SupplierPricingDetail />} />
              <Route path="/pricing/calculations" element={<PricingCalculations />} />
              <Route path="/pricing/calculations/:id" element={<PricingCalculationDetail />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  )
}

export default App