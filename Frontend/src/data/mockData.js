import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  Tags,
  Boxes,
  Warehouse,
  Building,
  Briefcase,
  ShieldCheck,
  Gift,
  BadgePercent,
} from "lucide-react";

export const navigationData = [
  {
    group: "Dashboard",
    items: [
      { name: "Overview", href: "/dashboard", icon: LayoutDashboard, allowedRoles: ["ADMIN", "EMPLOYEE", "VENDOR", "FIELD_EXECUTIVE"] },
    ],
  },
  {
    group: "Organization",
    items: [
      { name: "Departments", href: "/dashboard/departments", icon: Building, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["MANAGE_DEPARTMENTS"] },
      { name: "Designations", href: "/dashboard/designations", icon: Briefcase, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["MANAGE_DESIGNATIONS"] },
      { name: "Permissions", href: "/dashboard/permissions", icon: ShieldCheck, allowedRoles: ["ADMIN"], permissionsNeeded: ["MANAGE_PERMISSIONS"] },
      { name: "Employees", href: "/dashboard/employees", icon: Building2, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_EMPLOYEES"] },
      { name: "Customers", href: "/dashboard/customers", icon: Users, allowedRoles: ["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"], permissionsNeeded: ["VIEW_CUSTOMERS"] },
    ],
  },
  {
    group: "Catalog",
    items: [
      { name: "Categories", href: "/dashboard/categories", icon: Tags, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_CATEGORIES"] },
      { name: "SubCategories", href: "/dashboard/subcategories", icon: Boxes, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_SUBCATEGORIES"] },
    ],
  },
  {
    group: "Business",
    items: [
      { name: "Products", href: "/dashboard/products", icon: Package, allowedRoles: ["ADMIN", "EMPLOYEE", "VENDOR"], permissionsNeeded: ["VIEW_PRODUCTS"] },
      { name: "Inventory", href: "/dashboard/inventory", icon: Warehouse, allowedRoles: ["ADMIN", "EMPLOYEE"], permissionsNeeded: ["VIEW_INVENTORY"] },
    ],
  },
  {
    group: "Schemes",
    items: [
      { name: "Gift Articles", href: "/dashboard/gift-articles", icon: Gift, allowedRoles: ["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"], permissionsNeeded: ["VIEW_GIFT_ARTICLES"] },
      { name: "Schemes", href: "/dashboard/schemes", icon: BadgePercent, allowedRoles: ["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"], permissionsNeeded: ["VIEW_SCHEMES"] },
    ],
  },
];
