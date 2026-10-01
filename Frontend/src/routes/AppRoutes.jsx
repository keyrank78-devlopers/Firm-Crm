import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Dashboard } from "../pages/Dashboard";
import { Login } from "../pages/Login";
import { Departments } from "../pages/organization/Departments";
import { Designations } from "../pages/organization/Designations";
import { Categories } from "../pages/catalog/Categories";
import { CategoryForm } from "../pages/catalog/CategoryForm";
import { SubCategories } from "../pages/catalog/SubCategories";
import { SubCategoryForm } from "../pages/catalog/SubCategoryForm";
import { Products } from "../pages/business/Products";
import { ProductForm } from "../pages/business/ProductForm";
import { ProductView } from "../pages/business/ProductView";
import { Inventory } from "../pages/business/Inventory";
import { Customers } from "../pages/management/Customers";
import { Schemes } from "../pages/schemes/Schemes";
import { SchemeForm } from "../pages/schemes/SchemeForm";
import { SchemeView } from "../pages/schemes/SchemeView";
import { GiftArticles } from "../pages/schemes/GiftArticles";
import { GiftArticleForm } from "../pages/schemes/GiftArticleForm";
import { Employees } from "../pages/management/Employees";
import { EmployeeForm } from "../pages/management/EmployeeForm";
import { Permissions } from "../pages/management/Permissions";
import { useAuth } from "../context/AuthContext";

const PrivateRoute = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  const isAuthenticated = token && token !== "undefined" && token !== "null" && token !== "";
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AuthRoute = ({ children }) => {
  const { token, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  const isAuthenticated = token && token !== "undefined" && token !== "null" && token !== "";
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const RoleRoute = ({ children, allowedRoles = [], permissionsNeeded = [] }) => {
  const { hasRole, hasPermission, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  const roleAllowed = allowedRoles.length === 0 || hasRole(allowedRoles);
  const permissionAllowed = permissionsNeeded.length === 0 || hasPermission(permissionsNeeded);

  if (!roleAllowed || !permissionAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthRoute><Login /></AuthRoute>} />

      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<Dashboard />} />

        <Route path="departments" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["MANAGE_DEPARTMENTS"]}><Departments /></RoleRoute>} />
        <Route path="designations" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["MANAGE_DESIGNATIONS"]}><Designations /></RoleRoute>} />
        <Route path="permissions" element={<RoleRoute allowedRoles={["ADMIN"]} permissionsNeeded={["MANAGE_PERMISSIONS"]}><Permissions /></RoleRoute>} />

        <Route path="customers" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_CUSTOMERS"]}><Customers /></RoleRoute>} />
        <Route path="employees" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><Employees /></RoleRoute>} />
        <Route path="employees/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><EmployeeForm /></RoleRoute>} />
        <Route path="employees/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_EMPLOYEES"]}><EmployeeForm /></RoleRoute>} />

        <Route path="categories" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><Categories /></RoleRoute>} />
        <Route path="categories/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><CategoryForm /></RoleRoute>} />
        <Route path="categories/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_CATEGORIES"]}><CategoryForm /></RoleRoute>} />

        <Route path="subcategories" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_SUBCATEGORIES"]}><SubCategories /></RoleRoute>} />
        <Route path="subcategories/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_SUBCATEGORIES"]}><SubCategoryForm /></RoleRoute>} />
        <Route path="subcategories/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_SUBCATEGORIES"]}><SubCategoryForm /></RoleRoute>} />

        <Route path="products" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><Products /></RoleRoute>} />
        <Route path="products/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><ProductForm /></RoleRoute>} />
        <Route path="products/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><ProductForm /></RoleRoute>} />
        <Route path="products/view/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "VENDOR"]} permissionsNeeded={["VIEW_PRODUCTS"]}><ProductView /></RoleRoute>} />

        <Route path="inventory" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE"]} permissionsNeeded={["VIEW_INVENTORY"]}><Inventory /></RoleRoute>} />

        <Route path="schemes" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_SCHEMES"]}><Schemes /></RoleRoute>} />
        <Route path="schemes/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["CREATE_SCHEMES"]}><SchemeForm /></RoleRoute>} />
        <Route path="schemes/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["EDIT_SCHEMES"]}><SchemeForm /></RoleRoute>} />
        <Route path="schemes/view/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_SCHEMES"]}><SchemeView /></RoleRoute>} />
        <Route path="gift-articles" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["VIEW_GIFT_ARTICLES"]}><GiftArticles /></RoleRoute>} />
        <Route path="gift-articles/create" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["CREATE_GIFT_ARTICLES"]}><GiftArticleForm /></RoleRoute>} />
        <Route path="gift-articles/edit/:id" element={<RoleRoute allowedRoles={["ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"]} permissionsNeeded={["EDIT_GIFT_ARTICLES"]}><GiftArticleForm /></RoleRoute>} />

        <Route path="*" element={<div className="p-4">404 Not Found</div>} />
      </Route>
    </Routes>
  );
};
