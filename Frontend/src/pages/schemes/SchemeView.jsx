import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import schemeService from "../../services/schemeService";
import { cn } from "../../utils/cn";
import {
  apiErrorMessage,
  describeScheme,
  formatDate,
  IMMEDIATE_MODES,
  labelFor,
  SCHEME_TYPES,
} from "./schemeConfig";

export function SchemeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [scheme, setScheme] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await schemeService.getSchemeById(id);
        if (!cancelled) setScheme(res.data);
      } catch (error) {
        toast.error(apiErrorMessage(error, "Failed to load scheme"));
        navigate("/dashboard/schemes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading scheme...</div>;
  if (!scheme) return null;

  const rows = describeScheme(scheme);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/schemes")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{scheme.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{scheme.code}</p>
          </div>
        </div>
        {hasPermission("EDIT_SCHEMES") && (
          <Button onClick={() => navigate(`/dashboard/schemes/edit/${scheme._id}`)}>
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:grid-cols-2">
        <Info label="Type" value={labelFor(SCHEME_TYPES, scheme.type)} />
        <Info label="Mode" value={scheme.mode ? labelFor(IMMEDIATE_MODES, scheme.mode) : "—"} />
        <Info label="Status" value={scheme.status} />
        <Info label="Priority" value={scheme.priority ?? 0} />
        <Info label="Start" value={formatDate(scheme.startDate)} />
        <Info label="End" value={formatDate(scheme.endDate)} />
        <div className="sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Description</p>
          <p className="mt-1 text-sm text-slate-800">{scheme.description || "—"}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-900">Configuration</h2>
        </div>
        <dl className="divide-y divide-slate-100">
          {rows.map(([label, value]) => (
            <div key={label} className="grid grid-cols-1 gap-1 px-6 py-4 sm:grid-cols-3">
              <dt className="text-sm font-medium text-slate-500">{label}</dt>
              <dd className={cn("text-sm text-slate-900 sm:col-span-2")}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
