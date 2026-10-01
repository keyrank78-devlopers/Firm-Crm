import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit2, Plus, Search, Shield, ShieldOff } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { ListPager } from "../../components/ui/ListPager";
import { useAuth } from "../../context/AuthContext";
import giftArticleService from "../../services/giftArticleService";
import { cn } from "../../utils/cn";
import { apiErrorMessage, formatMoney, GIFT_SOURCES, labelFor, selectClass } from "./schemeConfig";

export function GiftArticles() {
  const { hasPermission } = useAuth();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
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
        const res = await giftArticleService.getGiftArticles({
          search,
          status: status || undefined,
          source: source || undefined,
          page,
          limit: 10,
        });
        if (cancelled) return;
        setArticles(res.data || []);
        setTotalPages(res.pagination?.pages || 1);
      } catch (error) {
        if (!cancelled) toast.error(apiErrorMessage(error, "Failed to load gift articles"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [search, status, source, page]);

  const toggleStatus = async (article) => {
    try {
      const next = article.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await giftArticleService.changeStatus(article._id, next);
      toast.success(`Gift article marked as ${next}`);
      setArticles((rows) => rows.map((row) => (row._id === article._id ? { ...row, status: next } : row)));
    } catch (error) {
      toast.error(apiErrorMessage(error, "Failed to update status"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Gift Articles</h1>
          <p className="mt-1 text-sm text-slate-500">Glasses, fans, and other rewards that are not Freia products.</p>
        </div>
        {hasPermission("CREATE_GIFT_ARTICLES") && (
          <Button onClick={() => navigate("/dashboard/gift-articles/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Gift Article
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search name or code"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <select className={cn(selectClass, "sm:w-48")} value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }}>
          <option value="">All sources</option>
          {GIFT_SOURCES.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </select>
        <select className={cn(selectClass, "sm:w-40")} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {["Article", "Source", "Value", "Status", "Actions"].map((heading) => (
                  <th key={heading} className={cn("px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500", heading === "Actions" ? "text-right" : "text-left")}>
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading gift articles...</td></tr>
              ) : articles.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No gift articles found.</td></tr>
              ) : articles.map((article) => (
                <tr key={article._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{article.name}</div>
                    <div className="text-xs text-slate-500">{article.code}{article.type ? ` · ${article.type}` : ""}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{labelFor(GIFT_SOURCES, article.source)}</td>
                  <td className="px-6 py-4 text-sm text-slate-700">{article.value != null ? formatMoney(article.value) : "—"}</td>
                  <td className="px-6 py-4">
                    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", article.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")}>
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {hasPermission("EDIT_GIFT_ARTICLES") && (
                        <>
                          <Button variant="ghost" size="icon" title="Edit" onClick={() => navigate(`/dashboard/gift-articles/edit/${article._id}`)}>
                            <Edit2 className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" size="icon" title={article.status === "ACTIVE" ? "Deactivate" : "Activate"} onClick={() => toggleStatus(article)}>
                            {article.status === "ACTIVE" ? <ShieldOff className="h-4 w-4 text-red-500" /> : <Shield className="h-4 w-4 text-green-500" />}
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
