
import type { FC } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AppLayout from './components/Layout/AppLayout'
import Hvac from './components/Pages/Hvac'
import Onboarding from './components/Forms/TenantRegistration/Onboarding'
import ViewFloorPlan from './components/FloorPlan/ViewFloorPlan'
import UploadFloorPlanPage from './components/FloorPlan/UploadFloorPlanPage'
import UserViewFloorPlan from './components/Buildings/FloorPlans/UserViewFloorPlan'
import UserViewTenants from './components/Buildings/Tenants/UserViewTenants'
import UserViewSites from './components/Buildings/Sites/UserViewSites'
import HvacDeviceMappingPage from './components/DeviceMapping/HvacDeviceMappingPage'
import SiteHvacDetailsPage from './components/ViewHvacDetails/SiteHvacDetailsPage'
import DashboardWrapper from './components/Pages/DashboardWrapper'
import TenantsPage from './components/Forms/UpdateTenants/TenantsPage'
import SitesPage from './components/Forms/UpdateTenants/SitesPage'
import HvacsPages from './components/Forms/UpdateTenants/HvacsPages'
import OnboardingPage from './components/Pages/Onboarding/OnboardingPage'

// import HvacWsTable from './components/HvacWsTable.tsx'
// import Header from './components/Header/Header.tsx'
// import { HvacConfigForm } from './components/Forms/HvacConfigForm.tsx'

const App:FC = () => (

    // <div className='min-h-screen bg-gray-950 text-white'>
    //   <div className='mx-auto max-w-6xl py-8'>
    //     <Header />
    //     <div className='my-4 w-full border-b border-gray-600'></div>
    //     <HvacWsTable />
    //     <HvacConfigForm />
    //   </div>
    // </div>

    <BrowserRouter>
      <AppLayout>
        <Routes>
         <Route
            path="/user/tenants/:tenantId/sites/:siteId/dashboard"
            element={<DashboardWrapper />}
          />
          <Route path='/hvac' element={<Hvac />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path='/admin/update-tenant' element={<TenantsPage />} />
          <Route path="/admin/tenants/query/:tenantId/sites" element={<SitesPage />} />
          <Route path="/admin/tenants/query/:tenantId/sites/:siteId/hvacs" element={<HvacsPages />} />
          <Route
              path="/admin/tenants/:tenantId/sites/:siteId/floor-plans/upload"
              element={<UploadFloorPlanPage />}
           />
          <Route
            path="/admin/tenants/:tenantId/sites/:siteId/floor-plans/view"
            element={<ViewFloorPlan />}
          />
          <Route
            path="/buildings/user/tenants/:tenantId/sites/:siteId/floor-plans/view"
            element={<UserViewFloorPlan />}
          />
          <Route path="/buildings/user/tenants" element={<UserViewTenants />} />
          <Route path="/user/tenants/:tenantId/sites" element={<UserViewSites />} />
          <Route
            path="/admin/tenants/:tenantId/sites/:siteId/hvac-device-mapping"
            element={<HvacDeviceMappingPage />}
          />

          <Route
            path="/user/tenants/:tenantId/sites/:siteId/hvacs"
            element={<SiteHvacDetailsPage />}
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
)

export default App;
