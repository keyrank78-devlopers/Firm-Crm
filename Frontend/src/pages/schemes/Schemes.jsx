import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Eye, Plus, Search, Shield, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ListPager } from "../../components/ui/ListPager";
import { useAuth } from "../../context/AuthContext";
import schemeService from "../../services/schemeService";
import { cn } from "../../utils/cn";
import {
  apiErrorMessage,
  formatDate,
  IMMEDIATE_MODES,
  labelFor,
  SCHEME_TYPES,
  selectClass,
} from "./schemeConfig";

export function Schemes() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [mode, setMode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await schemeService.getSchemes({
          search,
          status: status || undefined,
          type: type || undefined,
          mode: mode || undefined,
          from: from || undefined,
          to: to || undefined,
          page,
          limit: 10,
        });
        if (cancelled) return;
        setSchemes(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
      } catch (error) {
        if (!cancelled) toast.error(apiErrorMessage(error, "Failed to load schemes"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search, status, type, mode, from, to, page]);

  const toggleStatus = async (scheme) => {
    try {
      const next = scheme.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await schemeService.changeStatus(scheme._id, next);
      toast.success(`Scheme marked as ${next}`);
      setSchemes((rows) => rows.map((row) => (row._id === scheme._id ? { ...row, status: next } : row)));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update status"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Schemes</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage scheme rules. Orders do not apply them yet.</p>
        </div>
        {hasPermission("CREATE_SCHEMES") && (
          <Button onClick={() => navigate("/dashboard/schemes/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Scheme
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-4">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input className="pl-9" placeholder="Search name or code" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
        </div>
        <select className={selectClass} value={type} onChange={(event) => { setType(event.target.value); setMode(""); setPage(1); }}>
          <option value="">All types</option>
          {SCHEME_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className={selectClass} value={mode} disabled={type && type !== "IMMEDIATE_ON_BILL"} onChange={(event) => { setMode(event.target.value); setPage(1); }}>
          <option value="">All modes</option>
          {IMMEDIATE_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
        <select className={selectClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <label className="text-xs text-slate-500">
          From
          <Input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} />
        </label>
        <label className="text-xs text-slate-500">
          To
          <Input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} />
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Scheme", "Type", "Period", "Priority", "Status", "Actions"].map((heading) => (
                  <th key={heading} className={cn("px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500", heading === "Actions" ? "text-right" : "text-left")}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading schemes...</td></tr>
              ) : schemes.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No schemes found.</td></tr>
              ) : schemes.map((scheme) => (
                <tr key={scheme._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{scheme.name}</div>
                    <div className="text-xs text-slate-500">{scheme.code}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">
                    <div>{labelFor(SCHEME_TYPES, scheme.type)}</div>
                    {scheme.mode && <div className="text-xs text-slate-500">{labelFor(IMMEDIATE_MODES, scheme.mode)}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{formatDate(scheme.startDate)} – {formatDate(scheme.endDate)}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{scheme.priority ?? 0}</td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", scheme.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                      {scheme.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="icon" title="View" onClick={() => navigate(`/dashboard/schemes/view/${scheme._id}`)}>
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                      {hasPermission("EDIT_SCHEMES") && (
                        <>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/dashboard/schemes/edit/${scheme._id}`)}>
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" title={scheme.status === "ACTIVE" ? "Deactivate" : "Activate"} onClick={() => toggleStatus(scheme)}>
                            {scheme.status === "ACTIVE" ? <ShieldOff className="h-4 w-4 text-red-500" /> : <Shield className="h-4 w-4 text-green-500" />}
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ListPager page={page} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  );
}
