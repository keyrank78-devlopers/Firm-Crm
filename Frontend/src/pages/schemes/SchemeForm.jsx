import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Field, RewardFields } from "../../components/schemes/RewardFields";
import { SearchSelect } from "../../components/schemes/SearchSelect";
import api from "../../services/api";
import giftArticleService from "../../services/giftArticleService";
import schemeService from "../../services/schemeService";
import {
  apiErrorMessage,
  buildSchemePayload,
  emptyReward,
  emptySchemeForm,
  IMMEDIATE_MODES,
  labelsFromScheme,
  productLabel,
  SCHEME_TYPES,
  schemeToForm,
  selectClass,
} from "./schemeConfig";

export function SchemeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptySchemeForm);
  const [labels, setLabels] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  const fetchGifts = useCallback(async (search) => {
    const res = await giftArticleService.getGiftArticles({ search, status: "ACTIVE", limit: 20 });
    return res.data || [];
  }, []);

  const fetchProducts = useCallback(async (search) => {
    const res = await api.get("/public/products/list", { params: { search, status: "ACTIVE", limit: 20 } });
    return res.data.data || [];
  }, []);

  useEffect(() => {
    if (!isEdit) return undefined;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await schemeService.getSchemeById(id);
        if (cancelled) return;
        setForm(schemeToForm(res.data));
        setLabels(labelsFromScheme(res.data));
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
  }, [id, isEdit, navigate]);

  const setField = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const remember = (recordId, label) => setLabels((current) => ({ ...current, [recordId]: label }));

  const updateSlab = (index, patch) => {
    setForm((current) => ({
      ...current,
      slabs: current.slabs.map((slab, slabIndex) => (slabIndex === index ? { ...slab, ...patch } : slab)),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let payload;
    try {
      payload = buildSchemePayload(form);
    } catch (error) {
      toast.error(error.message);
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await schemeService.updateScheme(id, payload);
        toast.success("Scheme updated");
      } else {
        await schemeService.createScheme(payload);
        toast.success("Scheme created");
      }
      navigate("/dashboard/schemes");
    } catch (error) {
      toast.error(apiErrorMessage(error, "Could not save scheme"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading scheme...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/schemes")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{isEdit ? "Edit Scheme" : "New Scheme"}</h1>
          <p className="mt-1 text-sm text-slate-500">One immediate scheme uses one mode. Product rewards use the product master.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">Scheme details</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            <Field label="Name *">
              <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
            </Field>
            <Field label="Code *">
              <Input value={form.code} onChange={(event) => setField("code", event.target.value.toUpperCase())} />
            </Field>
            <Field label="Type *">
              <select className={selectClass} value={form.type} onChange={(event) => setField("type", event.target.value)}>
                {SCHEME_TYPES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </Field>
            {form.type === "IMMEDIATE_ON_BILL" ? (
              <Field label="Mode *">
                <select className={selectClass} value={form.mode} onChange={(event) => setField("mode", event.target.value)}>
                  {IMMEDIATE_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </Field>
            ) : <div />}
            <Field label="Start date *">
              <Input type="date" value={form.startDate} onChange={(event) => setField("startDate", event.target.value)} />
            </Field>
            <Field label="End date *">
              <Input type="date" value={form.endDate} onChange={(event) => setField("endDate", event.target.value)} />
            </Field>
            <Field label="Priority">
              <Input type="number" min="0" step="1" value={form.priority} onChange={(event) => setField("priority", event.target.value)} />
            </Field>
            <Field label="Status">
              <select className={selectClass} value={form.status} onChange={(event) => setField("status", event.target.value)}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <textarea
                className="min-h-24 w-full rounded-md border border-slate-200 px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600"
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <h2 className="text-lg font-medium text-slate-900">Configuration</h2>
            <Link to="/dashboard/gift-articles" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">Gift articles</Link>
          </div>
          <div className="space-y-5 p-6">
            {form.type === "IMMEDIATE_ON_BILL" && form.mode === "AMOUNT" && (
              <>
                <Field label="Purchase amount (₹) *">
                  <Input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setField("amount", event.target.value)} />
                </Field>
                <RewardFields reward={form.amountReward} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} onChange={(reward) => setField("amountReward", reward)} />
              </>
            )}

            {form.type === "IMMEDIATE_ON_BILL" && form.mode === "PRODUCT" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Purchase product *">
                    <SearchSelect
                      selectedLabel={labels[form.purchaseProductId] || ""}
                      placeholder="Search product"
                      fetchItems={fetchProducts}
                      getLabel={productLabel}
                      onChange={(item) => {
                        remember(item._id, productLabel(item));
                        setField("purchaseProductId", item._id);
                      }}
                    />
                  </Field>
                  <Field label="Required quantity *">
                    <Input type="number" min="1" step="1" value={form.requiredQuantity} onChange={(event) => setField("requiredQuantity", event.target.value)} />
                  </Field>
                </div>
                <RewardFields reward={form.productReward} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} onChange={(reward) => setField("productReward", reward)} quantityLabel="Gift quantity" />
              </>
            )}

            {form.type === "IMMEDIATE_ON_BILL" && form.mode === "SLAB" && (
              <div className="space-y-4">
                {form.slabs.map((slab, index) => (
                  <div key={index} className="space-y-4 rounded-lg border border-slate-200 p-4">
                    <div className="flex items-end justify-between gap-3">
                      <Field label={`Threshold amount ${index + 1} (₹) *`} className="max-w-xs flex-1">
                        <Input type="number" min="0" step="0.01" value={slab.thresholdAmount} onChange={(event) => updateSlab(index, { thresholdAmount: event.target.value })} />
                      </Field>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={form.slabs.length === 1}
                        onClick={() => setField("slabs", form.slabs.filter((_, slabIndex) => slabIndex !== index))}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <RewardFields reward={slab.reward} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} onChange={(reward) => updateSlab(index, { reward })} />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={() => setField("slabs", [...form.slabs, { thresholdAmount: "", reward: emptyReward() }])}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add slab
                </Button>
              </div>
            )}

            {form.type === "NEW_PARTY_FIRST_PURCHASE" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Purchase amount (₹) *">
                    <Input type="number" min="0" step="0.01" value={form.purchaseAmount} onChange={(event) => setField("purchaseAmount", event.target.value)} />
                  </Field>
                  <Field label="Normal gift quantity *">
                    <Input type="number" min="1" step="1" value={form.normalGiftQuantity} onChange={(event) => setField("normalGiftQuantity", event.target.value)} />
                  </Field>
                  <Field label="New party gift quantity *">
                    <Input type="number" min="1" step="1" value={form.newPartyGiftQuantity} onChange={(event) => setField("newPartyGiftQuantity", event.target.value)} />
                  </Field>
                </div>
                <RewardFields reward={form.newPartyGift} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} showQuantity={false} onChange={(gift) => setField("newPartyGift", gift)} />
              </>
            )}

            {form.type === "TARGET_BASED" && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label="Target amount (₹) *">
                    <Input type="number" min="0" step="0.01" value={form.targetAmount} onChange={(event) => setField("targetAmount", event.target.value)} />
                  </Field>
                  <Field label="Duration *">
                    <Input type="number" min="1" step="1" value={form.duration} onChange={(event) => setField("duration", event.target.value)} />
                  </Field>
                  <Field label="Duration unit *">
                    <select className={selectClass} value={form.durationUnit} onChange={(event) => setField("durationUnit", event.target.value)}>
                      <option value="DAYS">Days</option>
                      <option value="MONTHS">Months</option>
                    </select>
                  </Field>
                </div>
                <RewardFields reward={form.targetReward} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} onChange={(reward) => setField("targetReward", reward)} />
              </>
            )}

            {form.type === "DUAL_STOCKIST_RETAIL" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <h3 className="font-medium text-slate-900">Stockist</h3>
                  <Field label="Article value (₹) *">
                    <Input type="number" min="0" step="0.01" value={form.stockistValue} onChange={(event) => setField("stockistValue", event.target.value)} />
                  </Field>
                  <RewardFields reward={form.stockistReward} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} onChange={(reward) => setField("stockistReward", reward)} />
                </div>
                <div className="space-y-4 rounded-lg border border-slate-200 p-4">
                  <h3 className="font-medium text-slate-900">Retail</h3>
                  <Field label="Article value (₹) *">
                    <Input type="number" min="0" step="0.01" value={form.retailValue} onChange={(event) => setField("retailValue", event.target.value)} />
                  </Field>
                  <RewardFields reward={form.retailReward} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} onChange={(reward) => setField("retailReward", reward)} />
                </div>
              </div>
            )}

            {form.type === "GIFT_TO_PRODUCT_CONVERSION" && (
              <>
                <RewardFields reward={form.conversionGift} labels={labels} fetchGifts={fetchGifts} fetchProducts={fetchProducts} onRemember={remember} showQuantity={false} onChange={(gift) => setField("conversionGift", gift)} />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Conversion value (₹) *">
                    <Input type="number" min="0" step="0.01" value={form.conversionValue} onChange={(event) => setField("conversionValue", event.target.value)} />
                  </Field>
                  <label className="flex items-center gap-2 pt-7 text-sm text-slate-700">
                    <input type="checkbox" checked={form.conversionAllowed} onChange={(event) => setField("conversionAllowed", event.target.checked)} />
                    Conversion allowed
                  </label>
                </div>
                <Field label="Allowed products *">
                  <SearchSelect
                    selectedLabel=""
                    placeholder="Add a Freia product"
                    fetchItems={fetchProducts}
                    getLabel={productLabel}
                    onChange={(item) => {
                      if (form.allowedProductIds.includes(item._id)) return;
                      remember(item._id, productLabel(item));
                      setField("allowedProductIds", [...form.allowedProductIds, item._id]);
                    }}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.allowedProductIds.map((productId) => (
                      <button
                        key={productId}
                        type="button"
                        className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                        onClick={() => setField("allowedProductIds", form.allowedProductIds.filter((item) => item !== productId))}
                      >
                        {labels[productId] || productId} ×
                      </button>
                    ))}
                  </div>
                </Field>
              </>
            )}
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate("/dashboard/schemes")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEdit ? "Update scheme" : "Create scheme"}</Button>
        </div>
      </form>
    </div>
  );
}
