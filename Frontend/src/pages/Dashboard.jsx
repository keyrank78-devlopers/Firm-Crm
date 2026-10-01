import { BadgePercent, Building2, Gift, Package, Tags, Users, Warehouse, ShieldCheck } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const shortcuts = [
  { label: "Customers", href: "/dashboard/customers", icon: Users },
  { label: "Employees", href: "/dashboard/employees", icon: Building2 },
  { label: "Categories", href: "/dashboard/categories", icon: Tags },
  { label: "Products", href: "/dashboard/products", icon: Package },
  { label: "Inventory", href: "/dashboard/inventory", icon: Warehouse },
  { label: "Schemes", href: "/dashboard/schemes", icon: BadgePercent },
  { label: "Gift Articles", href: "/dashboard/gift-articles", icon: Gift },
];

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.userType === "ADMIN";
  const designationName = user?.designation?.name || user?.role || user?.userType || "Team Member";

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Good morning, {user?.name || "User"}
            </h1>
            <span className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 text-xs px-2.5 py-0.5 rounded-full font-semibold">
              {designationName}
            </span>
          </div>
          <p className="text-sm text-slate-300">{currentDate}</p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => navigate("/dashboard/permissions")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
          >
            <ShieldCheck className="mr-1.5 h-4 w-4" />
            Manage Permissions
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {shortcuts.map((item) => (
          <button
            key={item.href}
            type="button"
            onClick={() => navigate(item.href)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-left hover:border-indigo-300 transition-colors"
          >
            <item.icon className="h-5 w-5 text-indigo-600" />
            <p className="mt-3 text-sm font-semibold text-slate-900">{item.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
