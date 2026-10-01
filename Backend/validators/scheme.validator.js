const mongoose = require("mongoose");
const Scheme = require("../models/Scheme");

const CONFIG_BY_MODE = {
    AMOUNT: "amountBased",
    PRODUCT: "productBased",
    SLAB: "slabBased",
};

const CONFIG_BY_TYPE = {
    NEW_PARTY_FIRST_PURCHASE: "newParty",
    TARGET_BASED: "targetBased",
    DUAL_STOCKIST_RETAIL: "dualStockistRetail",
    GIFT_TO_PRODUCT_CONVERSION: "conversion",
};

const isObjectId = (value) => {
    if (value == null || value === "") return false;
    if (value instanceof mongoose.Types.ObjectId) return true;
    if (typeof value === "object" && value._bsontype === "ObjectId") return true;
    return typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);
};

const isPresent = (value) => value !== undefined && value !== null && value !== "";

const positiveNumber = (value) => {
    if (typeof value === "boolean" || !isPresent(value)) return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
};

const positiveInt = (value) => {
    const n = positiveNumber(value);
    if (n == null || !Number.isInteger(n)) return null;
    return n;
};

const nonNegativeInt = (value) => {
    if (typeof value === "boolean" || !isPresent(value)) return null;
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n) || n < 0 || !Number.isInteger(n)) return null;
    return n;
};

const parseDate = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
    if (typeof value !== "string" && typeof value !== "number") return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const plain = (value) => (value && typeof value.toObject === "function" ? value.toObject() : value);

const expectedConfigKey = (type, mode) => {
    if (type === "IMMEDIATE_ON_BILL") return CONFIG_BY_MODE[mode] || null;
    return CONFIG_BY_TYPE[type] || null;
};

const readReward = (source, field, push, refs, requireQuantity) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        push(field, "Reward is required");
        return null;
    }

    const hasGift = isPresent(source.giftArticle);
    const hasProduct = isPresent(source.product);
    const reward = {};

    if (hasGift === hasProduct) {
        push(field, "Reward must reference either a gift article or a product");
    } else if (hasGift) {
        if (!isObjectId(source.giftArticle)) {
            push(`${field}.giftArticle`, "Gift article must be a valid id");
        } else {
            reward.giftArticle = source.giftArticle;
            refs.giftArticles.push({ id: String(source.giftArticle), field: `${field}.giftArticle` });
        }
    } else if (!isObjectId(source.product)) {
        push(`${field}.product`, "Product must be a valid id");
    } else {
        reward.product = source.product;
        refs.products.push({ id: String(source.product), field: `${field}.product` });
    }

    if (requireQuantity) {
        const quantity = positiveInt(source.quantity);
        if (quantity == null) {
            push(`${field}.quantity`, "Quantity must be a whole number greater than 0");
        } else {
            reward.quantity = quantity;
        }
    }

    return reward;
};

const readBenefit = (source, field, push, refs) => {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
        push(field, "Benefit is required");
        return null;
    }
    const value = positiveNumber(source.value);
    if (value == null) push(`${field}.value`, "Value must be greater than 0");
    const reward = readReward(source.reward, `${field}.reward`, push, refs, true);
    return { value: value == null ? undefined : value, reward };
};

const parseConfiguration = (type, mode, configuration, push, refs) => {
    if (!Scheme.SCHEME_TYPES.includes(type)) return null;
    if (type === "IMMEDIATE_ON_BILL" && !Scheme.IMMEDIATE_MODES.includes(mode)) return null;

    const allowedKey = expectedConfigKey(type, mode);
    if (!configuration || typeof configuration !== "object" || Array.isArray(configuration)) {
        push("configuration", "Configuration is required");
        return null;
    }

    const keys = Object.keys(configuration).filter((key) => configuration[key] !== undefined);
    if (!keys.includes(allowedKey)) {
        push("configuration", `${allowedKey} configuration is required`);
    }
    const extra = keys.filter((key) => key !== allowedKey);
    if (extra.length) {
        push("configuration", `Only ${allowedKey} configuration is allowed for this scheme`);
    }

    const source = configuration[allowedKey];
    if (!source || typeof source !== "object" || Array.isArray(source)) return null;

    if (allowedKey === "amountBased") {
        const amount = positiveNumber(source.amount);
        if (amount == null) push("configuration.amountBased.amount", "Amount must be greater than 0");
        const reward = readReward(source.reward, "configuration.amountBased.reward", push, refs, true);
        return { amountBased: { amount, reward } };
    }

    if (allowedKey === "productBased") {
        if (!isObjectId(source.product)) {
            push("configuration.productBased.product", "Product must be a valid id");
        } else {
            refs.products.push({ id: String(source.product), field: "configuration.productBased.product" });
        }
        const requiredQuantity = positiveInt(source.requiredQuantity);
        if (requiredQuantity == null) {
            push("configuration.productBased.requiredQuantity", "Required quantity must be a whole number greater than 0");
        }
        const reward = readReward(source.reward, "configuration.productBased.reward", push, refs, true);
        return {
            productBased: {
                product: source.product,
                requiredQuantity,
                reward,
            },
        };
    }

    if (allowedKey === "slabBased") {
        if (!Array.isArray(source.slabs) || source.slabs.length === 0) {
            push("configuration.slabBased.slabs", "At least one slab is required");
            return { slabBased: { slabs: [] } };
        }
        const seen = new Set();
        const slabs = source.slabs.map((slab, index) => {
            const field = `configuration.slabBased.slabs.${index}`;
            if (!slab || typeof slab !== "object" || Array.isArray(slab)) {
                push(field, "Slab is required");
                return null;
            }
            const thresholdAmount = positiveNumber(slab.thresholdAmount);
            if (thresholdAmount == null) {
                push(`${field}.thresholdAmount`, "Threshold amount must be greater than 0");
            } else if (seen.has(thresholdAmount)) {
                push(`${field}.thresholdAmount`, "Duplicate slab threshold");
            } else {
                seen.add(thresholdAmount);
            }
            const reward = readReward(slab.reward, `${field}.reward`, push, refs, true);
            return { thresholdAmount, reward };
        });
        return { slabBased: { slabs } };
    }

    if (allowedKey === "newParty") {
        const purchaseAmount = positiveNumber(source.purchaseAmount);
        if (purchaseAmount == null) push("configuration.newParty.purchaseAmount", "Purchase amount must be greater than 0");
        const normalGiftQuantity = positiveInt(source.normalGiftQuantity);
        if (normalGiftQuantity == null) {
            push("configuration.newParty.normalGiftQuantity", "Normal gift quantity must be a whole number greater than 0");
        }
        const newPartyGiftQuantity = positiveInt(source.newPartyGiftQuantity);
        if (newPartyGiftQuantity == null) {
            push("configuration.newParty.newPartyGiftQuantity", "New party gift quantity must be a whole number greater than 0");
        }
        const gift = readReward(source.gift, "configuration.newParty.gift", push, refs, false);
        return { newParty: { purchaseAmount, normalGiftQuantity, newPartyGiftQuantity, gift } };
    }

    if (allowedKey === "targetBased") {
        const targetAmount = positiveNumber(source.targetAmount);
        if (targetAmount == null) push("configuration.targetBased.targetAmount", "Target amount must be greater than 0");
        const duration = positiveInt(source.duration);
        if (duration == null) push("configuration.targetBased.duration", "Duration must be a whole number greater than 0");
        if (!Scheme.DURATION_UNITS.includes(source.durationUnit)) {
            push("configuration.targetBased.durationUnit", "Duration unit must be DAYS or MONTHS");
        }
        const reward = readReward(source.reward, "configuration.targetBased.reward", push, refs, true);
        return {
            targetBased: {
                targetAmount,
                duration,
                durationUnit: source.durationUnit,
                reward,
            },
        };
    }

    if (allowedKey === "dualStockistRetail") {
        return {
            dualStockistRetail: {
                stockist: readBenefit(source.stockist, "configuration.dualStockistRetail.stockist", push, refs),
                retail: readBenefit(source.retail, "configuration.dualStockistRetail.retail", push, refs),
            },
        };
    }

    const conversionAllowed = source.conversionAllowed;
    if (typeof conversionAllowed !== "boolean") {
        push("configuration.conversion.conversionAllowed", "Conversion allowed must be true or false");
    }
    const conversionValue = positiveNumber(source.conversionValue);
    if (conversionValue == null) push("configuration.conversion.conversionValue", "Conversion value must be greater than 0");
    if (!Array.isArray(source.allowedProductIds) || source.allowedProductIds.length === 0) {
        push("configuration.conversion.allowedProductIds", "At least one product is required");
    }
    const allowedProductIds = [];
    const seenProducts = new Set();
    if (Array.isArray(source.allowedProductIds)) {
        source.allowedProductIds.forEach((productId, index) => {
            const field = `configuration.conversion.allowedProductIds.${index}`;
            if (!isObjectId(productId)) {
                push(field, "Product must be a valid id");
                return;
            }
            const id = String(productId);
            if (seenProducts.has(id)) return;
            seenProducts.add(id);
            allowedProductIds.push(productId);
            refs.products.push({ id, field });
        });
    }
    const gift = readReward(source.gift, "configuration.conversion.gift", push, refs, false);
    return {
        conversion: {
            gift,
            conversionAllowed,
            conversionValue,
            allowedProductIds,
        },
    };
};

const parseScheme = (body) => {
    const errors = [];
    const push = (field, message) => errors.push({ field, message });
    const refs = { giftArticles: [], products: [] };

    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: [{ field: "body", message: "Request body is required" }], refs };
    }

    const name = String(body.name ?? "").trim();
    if (!name) push("name", "Name is required");

    const code = String(body.code ?? "").trim().toUpperCase();
    if (!code) push("code", "Code is required");

    const description = isPresent(body.description) ? String(body.description).trim() : undefined;
    const type = body.type;
    if (!Scheme.SCHEME_TYPES.includes(type)) {
        push("type", "Invalid scheme type");
    }

    let mode;
    if (type === "IMMEDIATE_ON_BILL") {
        mode = body.mode;
        if (!Scheme.IMMEDIATE_MODES.includes(mode)) {
            push("mode", "Immediate on-bill scheme requires mode AMOUNT, PRODUCT, or SLAB");
        }
    } else if (isPresent(body.mode)) {
        push("mode", "Mode is only allowed for IMMEDIATE_ON_BILL");
    }

    const startDate = parseDate(body.startDate);
    const endDate = parseDate(body.endDate);
    if (!startDate) push("startDate", "Start date is required");
    if (!endDate) push("endDate", "End date is required");
    if (startDate && endDate && startDate >= endDate) {
        push("endDate", "Start date must be before end date");
    }

    let priority = 0;
    if (isPresent(body.priority)) {
        priority = nonNegativeInt(body.priority);
        if (priority == null) push("priority", "Priority must be a whole number of 0 or more");
    }

    let status = "ACTIVE";
    if (body.status !== undefined) {
        if (!["ACTIVE", "INACTIVE"].includes(body.status)) {
            push("status", "Status must be ACTIVE or INACTIVE");
        } else {
            status = body.status;
        }
    }

    const configuration = parseConfiguration(type, mode, plain(body.configuration), push, refs);
    if (errors.length) return { errors, refs };

    const value = {
        name,
        code,
        type,
        status,
        startDate,
        endDate,
        priority,
        configuration,
    };
    if (description) value.description = description;
    if (mode) value.mode = mode;

    return { errors: [], value, refs };
};

const parseSchemeUpdate = (body, existing) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return { errors: [{ field: "body", message: "Request body is required" }], refs: { giftArticles: [], products: [] } };
    }

    const allowed = ["name", "code", "description", "type", "mode", "startDate", "endDate", "priority", "status", "configuration"];
    const hasAny = allowed.some((key) => Object.prototype.hasOwnProperty.call(body, key));
    if (!hasAny) {
        return { errors: [{ field: "body", message: "No fields to update" }], refs: { giftArticles: [], products: [] } };
    }

    const current = plain(existing);
    const typeChanged = Object.prototype.hasOwnProperty.call(body, "type") && body.type !== current.type;
    const modeChanged = Object.prototype.hasOwnProperty.call(body, "mode") && body.mode !== current.mode;
    if ((typeChanged || modeChanged) && !Object.prototype.hasOwnProperty.call(body, "configuration")) {
        return {
            errors: [{ field: "configuration", message: "Configuration is required when scheme type or mode changes" }],
            refs: { giftArticles: [], products: [] },
        };
    }

    const merged = {
        name: Object.prototype.hasOwnProperty.call(body, "name") ? body.name : current.name,
        code: Object.prototype.hasOwnProperty.call(body, "code") ? body.code : current.code,
        description: Object.prototype.hasOwnProperty.call(body, "description") ? body.description : current.description,
        type: Object.prototype.hasOwnProperty.call(body, "type") ? body.type : current.type,
        startDate: Object.prototype.hasOwnProperty.call(body, "startDate") ? body.startDate : current.startDate,
        endDate: Object.prototype.hasOwnProperty.call(body, "endDate") ? body.endDate : current.endDate,
        priority: Object.prototype.hasOwnProperty.call(body, "priority") ? body.priority : current.priority,
        status: Object.prototype.hasOwnProperty.call(body, "status") ? body.status : current.status,
        configuration: Object.prototype.hasOwnProperty.call(body, "configuration") ? body.configuration : current.configuration,
    };

    if (merged.type === "IMMEDIATE_ON_BILL") {
        merged.mode = Object.prototype.hasOwnProperty.call(body, "mode") ? body.mode : current.mode;
    }

    return parseScheme(merged);
};

module.exports = {
    parseScheme,
    parseSchemeUpdate,
};
