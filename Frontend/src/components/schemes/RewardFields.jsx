import { Input } from "../ui/Input";
import { SearchSelect } from "./SearchSelect";
import { giftLabel, productLabel, selectClass } from "../../pages/schemes/schemeConfig";

function Field({ label, children, className }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

export function RewardFields({
  reward,
  onChange,
  labels,
  fetchGifts,
  fetchProducts,
  onRemember,
  showQuantity = true,
  quantityLabel = "Quantity",
}) {
  const isProduct = reward.kind === "PRODUCT";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Field label="Reward type">
        <select
          className={selectClass}
          value={reward.kind}
          onChange={(event) => onChange({ ...reward, kind: event.target.value, id: "" })}
        >
          <option value="GIFT_ARTICLE">Gift article</option>
          <option value="PRODUCT">Freia product</option>
        </select>
      </Field>
      <Field label={isProduct ? "Product" : "Gift article"}>
        <SearchSelect
          selectedLabel={labels[reward.id] || ""}
          placeholder={isProduct ? "Search product" : "Search gift article"}
          fetchItems={isProduct ? fetchProducts : fetchGifts}
          getLabel={isProduct ? productLabel : giftLabel}
          onChange={(item) => {
            onRemember(item._id, isProduct ? productLabel(item) : giftLabel(item));
            onChange({ ...reward, id: item._id });
          }}
        />
      </Field>
      {showQuantity && (
        <Field label={quantityLabel}>
          <Input
            type="number"
            min="1"
            step="1"
            value={reward.quantity}
            onChange={(event) => onChange({ ...reward, quantity: event.target.value })}
          />
        </Field>
      )}
    </div>
  );
}

export { Field };
