import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import giftArticleService from "../../services/giftArticleService";
import { apiErrorMessage, GIFT_SOURCES, selectClass } from "./schemeConfig";

const emptyForm = {
  name: "",
  code: "",
  description: "",
  type: "",
  value: "",
  source: "CUSTOM",
  status: "ACTIVE",
};

export function GiftArticleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await giftArticleService.getGiftArticleById(id);
        if (cancelled) return;
        const article = res.data;
        setForm({
          name: article.name || "",
          code: article.code || "",
          description: article.description || "",
          type: article.type || "",
          value: article.value != null ? String(article.value) : "",
          source: article.source || "CUSTOM",
          status: article.status || "ACTIVE",
        });
      } catch (error) {
        toast.error(apiErrorMessage(error, "Failed to load gift article"));
        navigate("/dashboard/gift-articles");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    if (form.value !== "" && (Number.isNaN(Number(form.value)) || Number(form.value) < 0)) {
      toast.error("Value must be 0 or more");
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      type: form.type.trim(),
      source: form.source,
      status: form.status,
      value: form.value === "" ? null : Number(form.value),
    };

    try {
      setSaving(true);
      if (isEdit) {
        await giftArticleService.updateGiftArticle(id, payload);
        toast.success("Gift article updated");
      } else {
        await giftArticleService.createGiftArticle(payload);
        toast.success("Gift article created");
      }
      navigate("/dashboard/gift-articles");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save gift article"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading gift article...</div>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/gift-articles")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? "Edit Gift Article" : "New Gift Article"}</h1>
          <p className="mt-1 text-sm text-slate-500">Source is a label only. This does not change product stock.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
            <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Code *</label>
            <Input value={form.code} onChange={(event) => setField("code", event.target.value.toUpperCase())} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Type</label>
            <Input value={form.type} placeholder="Glass, fan, box" onChange={(event) => setField("type", event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Value (₹)</label>
            <Input type="number" min="0" step="0.01" value={form.value} onChange={(event) => setField("value", event.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Source *</label>
            <select className={selectClass} value={form.source} onChange={(event) => setField("source", event.target.value)}>
              {GIFT_SOURCES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
            <select className={selectClass} value={form.status} onChange={(event) => setField("status", event.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/gift-articles")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEdit ? "Update" : "Create"}</Button>
        </div>
      </form>
    </div>
  );
}
