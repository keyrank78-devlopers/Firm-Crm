import { useEffect, useState } from "react";
import { Input } from "../ui/Input";

export function SearchSelect({ selectedLabel = "", placeholder, fetchItems, getLabel, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const rows = await fetchItems(query);
        if (!cancelled) setItems(rows || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, query, fetchItems]);

  return (
    <div className="relative">
      <Input
        value={open ? query : selectedLabel}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        onBlur={() => setOpen(false)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
      />
      {open && (
        <div
          className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg"
          onMouseDown={(event) => event.preventDefault()}
        >
          {loading ? (
            <p className="px-3 py-2 text-sm text-slate-500">Searching...</p>
          ) : items.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">No matches</p>
          ) : (
            items.map((item) => (
              <button
                key={item._id}
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-indigo-50"
                onClick={() => {
                  onChange(item);
                  setOpen(false);
                  setQuery("");
                }}
              >
                {getLabel(item)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
