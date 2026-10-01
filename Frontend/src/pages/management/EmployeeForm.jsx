import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../services/api";
import toast from "react-hot-toast";

export function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    department: "",
    designation: "",
    address: {
      city: "",
      state: "",
      pincode: "",
      locality: "",
      street: "",
      landmark: ""
    }
  });

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditMode);

  // Fetch departments and employee details if in edit mode
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const deptRes = await api.get("/admin/departments/list", { params: { status: "ACTIVE", limit: 100 } });
        setDepartments(deptRes.data.data || []);

        if (isEditMode) {
          const empRes = await api.get(`/admin/employees/details/${id}`);
          const employee = empRes.data.data;
          
          setFormData({
            name: employee.name || "",
            email: employee.email || "",
            phone: employee.phone || "",
            password: "",
            department: employee.department?._id || employee.department || "",
            designation: employee.designation?._id || employee.designation || "",
            address: {
              city: employee.address?.city || "",
              state: employee.address?.state || "",
              pincode: employee.address?.pincode || "",
              locality: employee.address?.locality || "",
              street: employee.address?.street || "",
              landmark: employee.address?.landmark || ""
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        toast.error("Failed to load data");
      } finally {
        setIsFetching(false);
      }
    };
    fetchInitialData();
  }, [id, isEditMode]);

  // Fetch designations based on selected department
  useEffect(() => {
    if (formData.department) {
      const fetchDesignations = async () => {
        try {
          const res = await api.get("/admin/designations/list", { params: { department: formData.department, status: "ACTIVE", limit: 100 } });
          setDesignations(res.data.data || []);
        } catch (error) {
          console.error("Failed to fetch designations", error);
        }
      };
      fetchDesignations();
    } else {
      setDesignations([]);
    }
  }, [formData.department]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (["city", "state", "pincode", "locality", "street", "landmark"].includes(name)) {
      setFormData(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const payload = { ...formData };
      if (isEditMode && !payload.password) {
        delete payload.password;
      }
      if (isEditMode) {
        delete payload.email;
      }

      if (isEditMode) {
        await api.patch(`/admin/employees/update/${id}`, payload);
        toast.success("Employee updated successfully");
      } else {
        await api.post("/admin/employees/create", payload);
        toast.success("Employee created successfully");
      }
      
      navigate("/dashboard/employees");
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="p-8 text-center text-slate-500">Loading data...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/employees")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? "Edit Employee" : "Create New Employee"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isEditMode ? "Update the employee's details and assignments." : "Fill in the details to add a new employee to the system."}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100">
          
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Basic Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} required disabled={isLoading || isEditMode} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number *</label>
                <Input name="phone" value={formData.phone} onChange={handleChange} required disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {isEditMode ? "Password (leave blank to keep current)" : "Password *"}
                </label>
                <Input name="password" type="password" value={formData.password} onChange={handleChange} required={!isEditMode} disabled={isLoading} />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 bg-slate-50">
            <h3 className="text-lg font-medium text-slate-900">Job Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  disabled={isLoading}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Designation *</label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                  disabled={isLoading || !formData.department}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Select a designation</option>
                  {designations.map((desig) => (
                    <option key={desig._id} value={desig._id}>{desig.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-slate-900">Address Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Street</label>
                <Input name="street" value={formData.address.street} onChange={handleChange} disabled={isLoading} />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Locality</label>
                <Input name="locality" value={formData.address.locality} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Landmark</label>
                <Input name="landmark" value={formData.address.landmark} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">City</label>
                <Input name="city" value={formData.address.city} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <Input name="state" value={formData.address.state} onChange={handleChange} disabled={isLoading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pincode</label>
                <Input name="pincode" value={formData.address.pincode} onChange={handleChange} disabled={isLoading} />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 flex items-center justify-end gap-3 rounded-b-xl">
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard/employees")} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[120px]">
              {isLoading ? "Saving..." : (isEditMode ? "Update Employee" : "Create Employee")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
