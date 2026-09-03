import { Outlet } from "react-router-dom";
import { LayoutDashboard, Building2, Users, Receipt, Wrench, UserCog, ShieldCheck, Wallet, TrendingUp, BarChart3, NotebookPen, PieChart,Banknote } from "lucide-react";
import Shell from "../../components/Shell";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/properties", label: "Properties", icon: Building2 },
  { to: "/admin/balances", label: "Balances", icon: Wallet },
  { to: "/admin/tenants", label: "Tenants", icon: Users },
  { to: "/admin/billing", label: "Billing", icon: Receipt },
  { to: "/admin/payments", label: "Payments", icon: Banknote },
  { to: "/admin/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/admin/expenses", label: "Expenses", icon: TrendingUp },
  { to: "/admin/sales-reports", label: "Sales reports", icon: BarChart3 },
  { to: "/admin/insights", label: "Insights", icon: PieChart },
  { to: "/admin/field-updates", label: "Field updates", icon: NotebookPen },
  { to: "/admin/staff", label: "Staff", icon: UserCog },
  { to: "/admin/audit", label: "Audit trail", icon: ShieldCheck },
];

export default function AdminLayout() {
  return (
    <Shell navItems={NAV}>
      <Outlet />
    </Shell>
  );
}
