import type { FC } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  Navigate,
} from "react-router-dom";
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
import UpdateUserProfile from "./components/UserManagement/UpdateUserProfile";
import DeleteUserPage from "./components/UserManagement/DeleteUserPage";
import ViewUsersPage from "./components/UserManagement/ViewUsersPage";

const AppRoutes: FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);

  return (
    <Routes>
      {/* Default route */}
      <Route path="/" element={<Navigate to="/buildings/user/tenants" replace />} />

      {/* ================= USER / TECHNICIAN ROUTES ================= */}
      <Route
        path="/hvac"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
            <Hvac />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buildings/user/tenants"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
            <UserViewTenants />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/tenants/:tenantId/sites"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
            <UserViewSites />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/tenants/:tenantId/sites/:siteId/dashboard"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
            <DashboardWrapper />
          </ProtectedRoute>
        }
      />

      <Route
        path="/buildings/user/tenants/:tenantId/sites/:siteId/floor-plans/view"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
            <UserViewFloorPlan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/user/tenants/:tenantId/sites/:siteId/hvacs"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN", "TECHNICIAN"]}>
            <SiteHvacDetailsPage />
          </ProtectedRoute>
        }
      />

      {/* ================= ADMIN ROUTES ================= */}
      <Route
        path="/admin/update-tenant"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <TenantsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tenants/query/:tenantId/sites"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <SitesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tenants/query/:tenantId/sites/:siteId/hvacs"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <HvacsPages />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tenants/:tenantId/sites/:siteId/floor-plans/upload"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <UploadFloorPlanPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tenants/:tenantId/sites/:siteId/floor-plans/view"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <ViewFloorPlan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/tenants/:tenantId/sites/:siteId/hvac-device-mapping"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <HvacDeviceMappingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <UserManagementPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/user-management/edit-user"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <UpdateUserProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/user-management/delete-user"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <DeleteUserPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/user-management/view-users"
        element={
          <ProtectedRoute allowedRoles={["ADMIN", "BMS_ADMIN"]}>
            <ViewUsersPage />
          </ProtectedRoute>
        }
      />

      {/* 🚫 ACCESS DENIED */}
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/access-denied" replace />} />
    </Routes>
  );
};

const App: FC = () => (
  <BrowserRouter>
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  </BrowserRouter>
);

export default App;