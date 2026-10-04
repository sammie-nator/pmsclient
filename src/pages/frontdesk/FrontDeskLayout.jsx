import { Outlet } from "react-router-dom";
import { LayoutDashboard, Users, Receipt, Wrench, Wallet } from "lucide-react";
import Shell from "../../components/Shell";

const NAV = [
  { to: "/frontdesk", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/frontdesk/tenants", label: "Tenants", icon: Users },
  { to: "/frontdesk/balances", label: "Balances", icon: Wallet },
  { to: "/frontdesk/billing", label: "Billing", icon: Receipt },
  { to: "/frontdesk/maintenance", label: "Maintenance", icon: Wrench },
];

export default function FrontDeskLayout() {
  return (
    <Shell navItems={NAV}>
      <Outlet />
    </Shell>
  );
}
