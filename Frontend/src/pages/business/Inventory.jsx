import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import api from "../../services/api";
import toast from "react-hot-toast";
import { cn } from "../../utils/cn";
import { useAuth } from "../../context/AuthContext";

export function Inventory() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("MANAGE_INVENTORY") || hasPermission("EDIT_PRODUCTS");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [drafts, setDrafts] = useState({});

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.get("/public/categories/list", { params: { status: "ACTIVE", limit: 100 } })
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/public/products/list", {
        params: {
          search,
          category: categoryFilter,
          stockStatus: stockFilter,
          page,
          limit: 10,
        },
      });
      const rows = res.data.data || [];
      setProducts(rows);
      setTotalPages(res.data.pagination?.pages || 1);
      setTotal(res.data.pagination?.total || 0);
      setDrafts(Object.fromEntries(rows.map((item) => [item._id, item.stock ?? 0])));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, stockFilter, page]);

  const saveStock = async (product) => {
    const nextStock = drafts[product._id];
    if (nextStock === "" || Number(nextStock) < 0 || !Number.isInteger(Number(nextStock))) {
      toast.error("Stock must be a whole number, 0 or more");
      return;
    }
    try {
      setSavingId(product._id);
      await api.patch(`/admin/products/stock/${product._id}`, { stock: Number(nextStock) });
      toast.success(Number(nextStock) > 0 ? "Marked in stock" : "Marked out of stock");
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update stock");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Inventory</h1>
        <p className="text-sm text-slate-500 mt-1">Set how many units are left. 0 is out of stock.</p>
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search product name or ID..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[160px]"
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category._id} value={category._id}>{category.name}</option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 min-w-[160px]"
          value={stockFilter}
          onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Stock</option>
          <option value="IN_STOCK">In Stock</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
        </select>
        <p className="self-center text-sm text-slate-500">{total} products</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Product</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Category</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Availability</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading inventory...</td></tr>
              ) : products.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No products found.</td></tr>
              ) : products.map((product) => {
                const inStock = (product.stock ?? 0) > 0;
                return (
                  <tr key={product._id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-900">{product.name}</p>
                      <p className="text-xs text-slate-500">{product.productCode || product.productId} · GST {product.gstPercent ?? 0}%</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {product.category?.name || "-"}
                      <p className="text-xs text-slate-400">{product.subCategory?.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                        inStock ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {inStock ? "In Stock" : "Out of Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className="w-24"
                          value={drafts[product._id] ?? 0}
                          disabled={!canManage || savingId === product._id}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [product._id]: e.target.value }))}
                        />
                        {canManage && (
                          <Button
                            size="sm"
                            disabled={savingId === product._id}
                            onClick={() => saveStock(product)}
                          >
                            Save
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-sm text-slate-700">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </p>
            <div className="inline-flex">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-l-md px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-r-md px-3 py-2 text-sm text-slate-600 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
