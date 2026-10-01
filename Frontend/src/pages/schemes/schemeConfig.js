export const SCHEME_TYPES = [
  { value: "IMMEDIATE_ON_BILL", label: "Immediate on bill" },
  { value: "NEW_PARTY_FIRST_PURCHASE", label: "New party first purchase" },
  { value: "TARGET_BASED", label: "Target based" },
  { value: "DUAL_STOCKIST_RETAIL", label: "Dual stockist + retail" },
  { value: "GIFT_TO_PRODUCT_CONVERSION", label: "Gift to product conversion" },
];

export const IMMEDIATE_MODES = [
  { value: "AMOUNT", label: "Amount based" },
  { value: "PRODUCT", label: "Product based" },
  { value: "SLAB", label: "Slab based" },
];

export const GIFT_SOURCES = [
  { value: "INTERNAL_STOCK", label: "Internal stock" },
  { value: "EXTERNAL_PURCHASE", label: "External purchase" },
  { value: "CUSTOM", label: "Custom" },
];

export const selectClass = "flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600";

export const labelFor = (options, value) => options.find((item) => item.value === value)?.label || value || "—";

export const giftLabel = (gift) => {
  if (!gift) return "";
  return gift.code ? `${gift.name} (${gift.code})` : gift.name || "";
};

export const productLabel = (product) => {
  if (!product) return "";
  return product.productCode ? `${product.name} (${product.productCode})` : product.name || "";
};

export const refId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
};

export const emptyReward = () => ({ kind: "GIFT_ARTICLE", id: "", quantity: "1" });
export const emptyGift = () => ({ kind: "GIFT_ARTICLE", id: "" });

export const emptySchemeForm = () => ({
  name: "",
  code: "",
  description: "",
  type: "IMMEDIATE_ON_BILL",
  mode: "AMOUNT",
  status: "ACTIVE",
  startDate: "",
  endDate: "",
  priority: "0",
  amount: "",
  amountReward: emptyReward(),
  purchaseProductId: "",
  requiredQuantity: "",
  productReward: emptyReward(),
  slabs: [{ thresholdAmount: "", reward: emptyReward() }],
  purchaseAmount: "",
  normalGiftQuantity: "1",
  newPartyGiftQuantity: "2",
  newPartyGift: emptyGift(),
  targetAmount: "",
  duration: "",
  durationUnit: "MONTHS",
  targetReward: emptyReward(),
  stockistValue: "",
  stockistReward: emptyReward(),
  retailValue: "",
  retailReward: emptyReward(),
  conversionAllowed: true,
  conversionValue: "",
  conversionGift: emptyGift(),
  allowedProductIds: [],
});

const rewardFromApi = (reward) => ({
  kind: reward?.product ? "PRODUCT" : "GIFT_ARTICLE",
  id: refId(reward?.product) || refId(reward?.giftArticle),
  quantity: reward?.quantity != null ? String(reward.quantity) : "1",
});

const giftFromApi = (gift) => ({
  kind: gift?.product ? "PRODUCT" : "GIFT_ARTICLE",
  id: refId(gift?.product) || refId(gift?.giftArticle),
});

export const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatMoney = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";
  return `₹${amount.toLocaleString("en-IN")}`;
};

const rememberRef = (map, record, labelFn) => {
  const id = refId(record);
  if (id && record && typeof record === "object") map[id] = labelFn(record);
};

const rememberReward = (map, reward) => {
  rememberRef(map, reward?.giftArticle, giftLabel);
  rememberRef(map, reward?.product, productLabel);
};

export const labelsFromScheme = (scheme) => {
  const map = {};
  const config = scheme?.configuration || {};
  rememberReward(map, config.amountBased?.reward);
  rememberRef(map, config.productBased?.product, productLabel);
  rememberReward(map, config.productBased?.reward);
  (config.slabBased?.slabs || []).forEach((slab) => rememberReward(map, slab.reward));
  rememberReward(map, config.newParty?.gift);
  rememberReward(map, config.targetBased?.reward);
  rememberReward(map, config.dualStockistRetail?.stockist?.reward);
  rememberReward(map, config.dualStockistRetail?.retail?.reward);
  rememberReward(map, config.conversion?.gift);
  (config.conversion?.allowedProductIds || []).forEach((product) => rememberRef(map, product, productLabel));
  return map;
};

export const schemeToForm = (scheme) => {
  const config = scheme.configuration || {};
  const base = emptySchemeForm();
  return {
    ...base,
    name: scheme.name || "",
    code: scheme.code || "",
    description: scheme.description || "",
    type: scheme.type || base.type,
    mode: scheme.mode || "AMOUNT",
    status: scheme.status || "ACTIVE",
    startDate: toDateInput(scheme.startDate),
    endDate: toDateInput(scheme.endDate),
    priority: scheme.priority != null ? String(scheme.priority) : "0",
    amount: config.amountBased?.amount != null ? String(config.amountBased.amount) : "",
    amountReward: config.amountBased?.reward ? rewardFromApi(config.amountBased.reward) : emptyReward(),
    purchaseProductId: refId(config.productBased?.product),
    requiredQuantity: config.productBased?.requiredQuantity != null ? String(config.productBased.requiredQuantity) : "",
    productReward: config.productBased?.reward ? rewardFromApi(config.productBased.reward) : emptyReward(),
    slabs: config.slabBased?.slabs?.length
      ? config.slabBased.slabs.map((slab) => ({
        thresholdAmount: slab.thresholdAmount != null ? String(slab.thresholdAmount) : "",
        reward: rewardFromApi(slab.reward),
      }))
      : base.slabs,
    purchaseAmount: config.newParty?.purchaseAmount != null ? String(config.newParty.purchaseAmount) : "",
    normalGiftQuantity: config.newParty?.normalGiftQuantity != null ? String(config.newParty.normalGiftQuantity) : "1",
    newPartyGiftQuantity: config.newParty?.newPartyGiftQuantity != null ? String(config.newParty.newPartyGiftQuantity) : "2",
    newPartyGift: config.newParty?.gift ? giftFromApi(config.newParty.gift) : emptyGift(),
    targetAmount: config.targetBased?.targetAmount != null ? String(config.targetBased.targetAmount) : "",
    duration: config.targetBased?.duration != null ? String(config.targetBased.duration) : "",
    durationUnit: config.targetBased?.durationUnit || "MONTHS",
    targetReward: config.targetBased?.reward ? rewardFromApi(config.targetBased.reward) : emptyReward(),
    stockistValue: config.dualStockistRetail?.stockist?.value != null ? String(config.dualStockistRetail.stockist.value) : "",
    stockistReward: config.dualStockistRetail?.stockist?.reward ? rewardFromApi(config.dualStockistRetail.stockist.reward) : emptyReward(),
    retailValue: config.dualStockistRetail?.retail?.value != null ? String(config.dualStockistRetail.retail.value) : "",
    retailReward: config.dualStockistRetail?.retail?.reward ? rewardFromApi(config.dualStockistRetail.retail.reward) : emptyReward(),
    conversionAllowed: config.conversion?.conversionAllowed !== false,
    conversionValue: config.conversion?.conversionValue != null ? String(config.conversion.conversionValue) : "",
    conversionGift: config.conversion?.gift ? giftFromApi(config.conversion.gift) : emptyGift(),
    allowedProductIds: (config.conversion?.allowedProductIds || []).map(refId).filter(Boolean),
  };
};

const positiveNumber = (value, label) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return amount;
};

const positiveInt = (value, label) => {
  const amount = Number(value);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`${label} must be a whole number greater than 0`);
  }
  return amount;
};

const rewardPayload = (reward, label) => {
  if (!reward?.id) throw new Error(`${label} is required`);
  const quantity = positiveInt(reward.quantity, `${label} quantity`);
  if (reward.kind === "PRODUCT") return { product: reward.id, quantity };
  return { giftArticle: reward.id, quantity };
};

const giftPayload = (gift, label) => {
  if (!gift?.id) throw new Error(`${label} is required`);
  if (gift.kind === "PRODUCT") return { product: gift.id };
  return { giftArticle: gift.id };
};

export const buildSchemePayload = (form) => {
  const name = form.name.trim();
  const code = form.code.trim().toUpperCase();
  if (!name) throw new Error("Name is required");
  if (!code) throw new Error("Code is required");
  if (!form.startDate) throw new Error("Start date is required");
  if (!form.endDate) throw new Error("End date is required");
  if (form.startDate >= form.endDate) throw new Error("Start date must be before end date");

  let priority = 0;
  if (String(form.priority).trim() !== "") {
    priority = Number(form.priority);
    if (!Number.isInteger(priority) || priority < 0) {
      throw new Error("Priority must be a whole number of 0 or more");
    }
  }

  const payload = {
    name,
    code,
    description: form.description.trim(),
    type: form.type,
    status: form.status,
    startDate: form.startDate,
    endDate: form.endDate,
    priority,
    configuration: {},
  };

  if (form.type === "IMMEDIATE_ON_BILL") {
    payload.mode = form.mode;
    if (form.mode === "AMOUNT") {
      payload.configuration.amountBased = {
        amount: positiveNumber(form.amount, "Purchase amount"),
        reward: rewardPayload(form.amountReward, "Reward"),
      };
    } else if (form.mode === "PRODUCT") {
      if (!form.purchaseProductId) throw new Error("Purchase product is required");
      payload.configuration.productBased = {
        product: form.purchaseProductId,
        requiredQuantity: positiveInt(form.requiredQuantity, "Required quantity"),
        reward: rewardPayload(form.productReward, "Reward"),
      };
    } else if (form.mode === "SLAB") {
      if (!form.slabs.length) throw new Error("At least one slab is required");
      const seen = new Set();
      payload.configuration.slabBased = {
        slabs: form.slabs.map((slab, index) => {
          const thresholdAmount = positiveNumber(slab.thresholdAmount, `Slab ${index + 1} threshold`);
          if (seen.has(thresholdAmount)) throw new Error("Slab thresholds must be different");
          seen.add(thresholdAmount);
          return {
            thresholdAmount,
            reward: rewardPayload(slab.reward, `Slab ${index + 1} reward`),
          };
        }),
      };
    } else {
      throw new Error("Select an immediate scheme mode");
    }
  } else if (form.type === "NEW_PARTY_FIRST_PURCHASE") {
    payload.configuration.newParty = {
      purchaseAmount: positiveNumber(form.purchaseAmount, "Purchase amount"),
      normalGiftQuantity: positiveInt(form.normalGiftQuantity, "Normal gift quantity"),
      newPartyGiftQuantity: positiveInt(form.newPartyGiftQuantity, "New party gift quantity"),
      gift: giftPayload(form.newPartyGift, "Gift"),
    };
  } else if (form.type === "TARGET_BASED") {
    payload.configuration.targetBased = {
      targetAmount: positiveNumber(form.targetAmount, "Target amount"),
      duration: positiveInt(form.duration, "Duration"),
      durationUnit: form.durationUnit,
      reward: rewardPayload(form.targetReward, "Reward"),
    };
  } else if (form.type === "DUAL_STOCKIST_RETAIL") {
    payload.configuration.dualStockistRetail = {
      stockist: {
        value: positiveNumber(form.stockistValue, "Stockist value"),
        reward: rewardPayload(form.stockistReward, "Stockist reward"),
      },
      retail: {
        value: positiveNumber(form.retailValue, "Retail value"),
        reward: rewardPayload(form.retailReward, "Retail reward"),
      },
    };
  } else if (form.type === "GIFT_TO_PRODUCT_CONVERSION") {
    if (!form.allowedProductIds.length) throw new Error("Select at least one product for conversion");
    payload.configuration.conversion = {
      gift: giftPayload(form.conversionGift, "Gift"),
      conversionAllowed: Boolean(form.conversionAllowed),
      conversionValue: positiveNumber(form.conversionValue, "Conversion value"),
      allowedProductIds: form.allowedProductIds,
    };
  } else {
    throw new Error("Select a scheme type");
  }

  return payload;
};

export const rewardText = (reward) => {
  if (!reward) return "—";
  const name = reward.giftArticle ? giftLabel(reward.giftArticle) : productLabel(reward.product);
  if (!name) return "—";
  return reward.quantity != null ? `${name} × ${reward.quantity}` : name;
};

export const describeScheme = (scheme) => {
  const config = scheme.configuration || {};
  if (scheme.type === "IMMEDIATE_ON_BILL" && scheme.mode === "AMOUNT") {
    return [
      ["Purchase amount", formatMoney(config.amountBased?.amount)],
      ["Reward", rewardText(config.amountBased?.reward)],
    ];
  }
  if (scheme.type === "IMMEDIATE_ON_BILL" && scheme.mode === "PRODUCT") {
    return [
      ["Product", productLabel(config.productBased?.product) || "—"],
      ["Required quantity", config.productBased?.requiredQuantity ?? "—"],
      ["Reward", rewardText(config.productBased?.reward)],
    ];
  }
  if (scheme.type === "IMMEDIATE_ON_BILL" && scheme.mode === "SLAB") {
    return (config.slabBased?.slabs || []).map((slab, index) => [
      `Slab ${index + 1}`,
      `${formatMoney(slab.thresholdAmount)} → ${rewardText(slab.reward)}`,
    ]);
  }
  if (scheme.type === "NEW_PARTY_FIRST_PURCHASE") {
    return [
      ["Purchase amount", formatMoney(config.newParty?.purchaseAmount)],
      ["Gift", rewardText(config.newParty?.gift)],
      ["Normal quantity", config.newParty?.normalGiftQuantity ?? "—"],
      ["New party quantity", config.newParty?.newPartyGiftQuantity ?? "—"],
    ];
  }
  if (scheme.type === "TARGET_BASED") {
    return [
      ["Target amount", formatMoney(config.targetBased?.targetAmount)],
      ["Duration", `${config.targetBased?.duration ?? "—"} ${config.targetBased?.durationUnit || ""}`.trim()],
      ["Reward", rewardText(config.targetBased?.reward)],
    ];
  }
  if (scheme.type === "DUAL_STOCKIST_RETAIL") {
    return [
      ["Stockist value", formatMoney(config.dualStockistRetail?.stockist?.value)],
      ["Stockist reward", rewardText(config.dualStockistRetail?.stockist?.reward)],
      ["Retail value", formatMoney(config.dualStockistRetail?.retail?.value)],
      ["Retail reward", rewardText(config.dualStockistRetail?.retail?.reward)],
    ];
  }
  const products = (config.conversion?.allowedProductIds || []).map(productLabel).filter(Boolean);
  return [
    ["Gift", rewardText(config.conversion?.gift)],
    ["Conversion", config.conversion?.conversionAllowed ? "Allowed" : "Not allowed"],
    ["Conversion value", formatMoney(config.conversion?.conversionValue)],
    ["Allowed products", products.length ? products.join(", ") : "—"],
  ];
};

export const apiErrorMessage = (error, fallback) => {
  const data = error?.response?.data;
  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.map((item) => item.message).join(". ");
  }
  return data?.message || fallback;
};
