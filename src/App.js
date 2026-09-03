import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import RoleGate from "./pages/RoleGate";
import PayRentPage from "./pages/PayRentPage";
import RequireRole from "./components/RequireRole";

import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PropertiesPage from "./pages/admin/PropertiesPage";
import TenantsPage from "./pages/admin/TenantsPage";
import TenantDetailPage from "./pages/admin/TenantDetailPage";
import BillingPage from "./pages/admin/BillingPage";
import StaffPage from "./pages/admin/StaffPage";
import AuditPage from "./pages/admin/AuditPage";
import MaintenanceCostsPage from "./pages/admin/MaintenanceCostsPage";
import SalesReportsPage from "./pages/admin/SalesReportsPage";
import InsightsPage from "./pages/admin/InsightsPage";

import BalancesPage from "./pages/BalancesPage";
import FieldUpdatesPage from "./pages/FieldUpdatesPage";
import MaintenancePage from "./pages/MaintenancePage";

import AgentLayout from "./pages/agent/AgentLayout";
import AgentDashboard from "./pages/agent/AgentDashboard";

import FrontDeskLayout from "./pages/frontdesk/FrontDeskLayout";
import FrontDeskDashboard from "./pages/frontdesk/FrontDeskDashboard";

import PayRentPage from "./pages/PayRentPage";
import PaySuccessPage from "./pages/PaySuccessPage";
import PayFailedPage from "./pages/PayFailedPage";
import RentPaymentsPage from "./pages/admin/RentPaymentsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public — no login */}
        <Route path="/pay" element={<PayRentPage />} />

        <Route path="/" element={<RoleGate />} />

        <Route
          path="/admin"
          element={
            <RequireRole role="admin">
              <AdminLayout />
            </RequireRole>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="balances" element={<BalancesPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="expenses" element={<MaintenanceCostsPage />} />
          <Route path="sales-reports" element={<SalesReportsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="field-updates" element={<FieldUpdatesPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="payments" element={<RentPaymentsPage />} />
        </Route>

        <Route
          path="/agent"
          element={
            <RequireRole role="agent">
              <AgentLayout />
            </RequireRole>
          }
        >
          <Route index element={<AgentDashboard />} />
          <Route path="balances" element={<BalancesPage />} />
          <Route path="updates" element={<FieldUpdatesPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
        </Route>

        <Route
          path="/frontdesk"
          element={
            <RequireRole role="frontdesk">
              <FrontDeskLayout />
            </RequireRole>
          }
        >
          <Route index element={<FrontDeskDashboard />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="balances" element={<BalancesPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

          <Route path="/pay" element={<PayRentPage />} />
<Route path="/pay/success" element={<PaySuccessPage />} />
<Route path="/pay/failed" element={<PayFailedPage />} />
      </Routes>
    </BrowserRouter>
  );
}
