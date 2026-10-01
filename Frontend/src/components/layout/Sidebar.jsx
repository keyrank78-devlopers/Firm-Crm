import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../../utils/cn";
import { navigationData } from "../../data/mockData";
import { useAuth } from "../../context/AuthContext";

export function Sidebar({ collapsed, setCollapsed }) {
  const { hasRole, hasPermission } = useAuth();

  // Filter navigation items based on user's roles and permissions
  const visibleGroups = navigationData
    .map((group) => {
      const filteredItems = group.items.filter((item) => {
        if (item.allowedRoles && !hasRole(item.allowedRoles)) return false;
        if (item.permissionsNeeded && !hasPermission(item.permissionsNeeded)) return false;
        return true;
      });
      return { ...group, items: filteredItems };
    })
    .filter((group) => group.items.length > 0);
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200">
        {!collapsed && (
          <span className="text-lg font-bold text-slate-900 truncate">
            AK Techs
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
        <nav className="space-y-6 px-3">
          {visibleGroups.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {group.group}
                </h4>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                          isActive
                            ? "bg-indigo-50 text-indigo-600"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                          collapsed && "justify-center"
                        )
                      }
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon
                        className={cn(
                          "shrink-0",
                          collapsed ? "h-5 w-5" : "mr-3 h-5 w-5"
                        )}
                      />
                      {!collapsed && <span>{item.name}</span>}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

    </aside>
  );
}
