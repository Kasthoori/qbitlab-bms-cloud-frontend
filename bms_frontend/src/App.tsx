import type { FC } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useEffect } from "react";

import { setNavigator } from "./utils/navigation";

import AppLayout from "./components/Layout/AppLayout";
import Hvac from "./components/Pages/Hvac";
import ViewFloorPlan from "./components/FloorPlan/ViewFloorPlan";
import UploadFloorPlanPage from "./components/FloorPlan/UploadFloorPlanPage";
import UserViewFloorPlan from "./components/Buildings/FloorPlans/UserViewFloorPlan";
import UserViewTenants from "./components/Buildings/Tenants/UserViewTenants";
import UserViewSites from "./components/Buildings/Sites/UserViewSites";
import HvacDeviceMappingPage from "./components/DeviceMapping/HvacDeviceMappingPage";
import SiteHvacDetailsPage from "./components/ViewHvacDetails/SiteHvacDetailsPage";
import DashboardWrapper from "./components/Pages/DashboardWrapper";
import TenantsPage from "./components/Forms/UpdateTenants/TenantsPage";
import SitesPage from "./components/Forms/UpdateTenants/SitesPage";
import HvacsPages from "./components/Forms/UpdateTenants/HvacsPages";
import OnboardingPage from "./components/Pages/Onboarding/OnboardingPage";
import UserManagementPage from "./components/UserManagement/UserManagementPage";

import AccessDeniedPage from "./components/Pages/AccessDenied/AccessDeniedPage";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

/**
 * 🔥 This wrapper registers React Router navigation globally
 * so http.ts can use navigateTo() without reload
 */
const AppRoutes: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  return (
    <Routes>
      {/* ================= USER ROUTES ================= */}
      <Route
        path="/user/tenants/:tenantId/sites/:siteId/dashboard"
        element={<DashboardWrapper />}
      />

      <Route path="/user/tenants/:tenantId/sites" element={<UserViewSites />} />
      <Route path="/buildings/user/tenants" element={
                <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
                    <UserViewTenants />
                </ProtectedRoute>
              } />

      <Route
        path="/buildings/user/tenants/:tenantId/sites/:siteId/floor-plans/view"
        element={<UserViewFloorPlan />}
      />

      <Route
        path="/user/tenants/:tenantId/sites/:siteId/hvacs"
        element={<SiteHvacDetailsPage />}
      />

      {/* ================= ADMIN ROUTES ================= */}
      <Route path="/admin/update-tenant" element={
                  <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
                      <TenantsPage />
                  </ProtectedRoute>
                } 
              />

      <Route
        path="/admin/tenants/query/:tenantId/sites"
        element={<ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
                    <SitesPage /> 
                </ProtectedRoute>
              }
      />

      <Route
        path="/admin/tenants/query/:tenantId/sites/:siteId/hvacs"
        element={<HvacsPages />}
      />

      <Route
        path="/admin/tenants/:tenantId/sites/:siteId/floor-plans/upload"
        element={<UploadFloorPlanPage />}
      />

      <Route
        path="/admin/tenants/:tenantId/sites/:siteId/floor-plans/view"
        element={<ViewFloorPlan />}
      />

      <Route
        path="/admin/tenants/:tenantId/sites/:siteId/hvac-device-mapping"
        element={<HvacDeviceMappingPage />}
      />

      {/* 🔐 PROTECTED USER MANAGEMENT */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />

      {/* ================= GENERAL ================= */}
      <Route path="/hvac" element={<Hvac />} />
      <Route path="/onboarding" element={
        <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
          <OnboardingPage />
        </ProtectedRoute>
      } />

      {/* 🚫 ACCESS DENIED */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />
    </Routes>
  );
};

/**
 * 🔥 Main App
 */
const App: FC = () => (
  <BrowserRouter>
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  </BrowserRouter>
);

export default App;