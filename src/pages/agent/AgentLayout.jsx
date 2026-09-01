import { Outlet } from "react-router-dom";
import { LayoutDashboard, Wrench, Wallet, NotebookPen } from "lucide-react";
import Shell from "../../components/Shell";

const NAV = [
  { to: "/agent", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/agent/balances", label: "Balances", icon: Wallet },
  { to: "/agent/updates", label: "Field updates", icon: NotebookPen },
  { to: "/agent/maintenance", label: "Maintenance", icon: Wrench },
];

export default function AgentLayout() {
  return (
    <Shell navItems={NAV}>
      <Outlet />
    </Shell>
  );
}
