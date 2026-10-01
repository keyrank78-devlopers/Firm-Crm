import { useState, useEffect } from "react";
import { Plus, Search, Edit2, ShieldOff, Shield } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export function Employees() {
  const { hasPermission } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const fetchFiltersData = async () => {
    try {
      const [deptRes, desigRes] = await Promise.all([
        api.get("/admin/departments/list", { params: { limit: 100 } }),
        api.get("/admin/designations/list", { params: { limit: 100 } })
      ]);
      setDepartments(deptRes.data.data || []);
      setDesignations(desigRes.data.data || []);
    } catch (error) {
      console.error("Error fetching filters", error);
    }
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/employees/list", {
        params: { search, department: departmentFilter, designation: designationFilter, page, limit: 10 }
      });
      setEmployees(res.data.data || []);
      setTotalPages(res.data.pagination?.pages || 1);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiltersData();
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [search, departmentFilter, designationFilter, page]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await api.patch(`/admin/employees/status/${id}`, { status: newStatus });
      toast.success("Employee status updated");
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  const openEditPage = (employee) => {
    navigate(`/dashboard/employees/edit/${employee._id}`);
  };

  const openCreatePage = () => {
    navigate(`/dashboard/employees/create`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all employees in your organization.</p>
        </div>
        {(hasPermission("MANAGE_EMPLOYEES") || hasPermission("CREATE_EMPLOYEES")) && (
          <Button onClick={openCreatePage}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search by name, email or phone..." 
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        
        <select 
          className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-w-[150px]"
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Departments</option>
          {departments.map(d => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>

        <select 
          className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent min-w-[150px]"
          value={designationFilter}
          onChange={(e) => { setDesignationFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Designations</option>
          {designations.map(d => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading employees...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No employees found.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-900">{emp.name}</span>
                        <span className="text-xs text-slate-500">ID: {emp.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm text-slate-600">{emp.email}</span>
                        <span className="text-xs text-slate-500">{emp.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{emp.department?.name || "-"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-slate-600">{emp.designation?.name || "-"}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        emp.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      )}>
                        {emp.status || "ACTIVE"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {(hasPermission("MANAGE_EMPLOYEES") || hasPermission("EDIT_EMPLOYEES")) && (
                          <Button variant="ghost" size="icon" onClick={() => openEditPage(emp)} title="Edit">
                            <Edit2 className="h-4 w-4 text-slate-500 hover:text-indigo-600" />
                          </Button>
                        )}
                        {(hasPermission("MANAGE_EMPLOYEES") || hasPermission("DELETE_EMPLOYEES")) && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleToggleStatus(emp._id, emp.status || "ACTIVE")}
                            title={emp.status === "ACTIVE" || !emp.status ? "Deactivate" : "Activate"}
                          >
                            {emp.status === "ACTIVE" || !emp.status ? (
                              <ShieldOff className="h-4 w-4 text-red-500 hover:text-red-700" />
                            ) : (
                              <Shield className="h-4 w-4 text-green-500 hover:text-green-700" />
                            )}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-700">
                  Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    <span className="sr-only">Previous</span>
                    &lt;
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                  >
                    <span className="sr-only">Next</span>
                    &gt;
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
