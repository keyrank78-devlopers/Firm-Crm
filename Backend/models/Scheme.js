const mongoose = require("mongoose");

const SCHEME_TYPES = [
    "IMMEDIATE_ON_BILL",
    "NEW_PARTY_FIRST_PURCHASE",
    "TARGET_BASED",
    "DUAL_STOCKIST_RETAIL",
    "GIFT_TO_PRODUCT_CONVERSION",
];

const IMMEDIATE_MODES = ["AMOUNT", "PRODUCT", "SLAB"];
const DURATION_UNITS = ["DAYS", "MONTHS"];

const objectId = mongoose.Schema.Types.ObjectId;

const rewardSchema = new mongoose.Schema(
    {
        giftArticle: { type: objectId, ref: "GiftArticle" },
        product: { type: objectId, ref: "Product" },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

rewardSchema.pre("validate", function () {
    const hasGift = Boolean(this.giftArticle);
    const hasProduct = Boolean(this.product);
    if (hasGift === hasProduct) {
        this.invalidate("giftArticle", "Reward must reference either a gift article or a product");
    }
});

const giftRefSchema = new mongoose.Schema(
    {
        giftArticle: { type: objectId, ref: "GiftArticle" },
        product: { type: objectId, ref: "Product" },
    },
    { _id: false }
);

giftRefSchema.pre("validate", function () {
    const hasGift = Boolean(this.giftArticle);
    const hasProduct = Boolean(this.product);
    if (hasGift === hasProduct) {
        this.invalidate("giftArticle", "Gift must reference either a gift article or a product");
    }
});

const amountBasedSchema = new mongoose.Schema(
    {
        amount: { type: Number, required: true, min: 0 },
        reward: { type: rewardSchema, required: true },
    },
    { _id: false }
);

const productBasedSchema = new mongoose.Schema(
    {
        product: { type: objectId, ref: "Product", required: true },
        requiredQuantity: { type: Number, required: true, min: 1 },
        reward: { type: rewardSchema, required: true },
    },
    { _id: false }
);

const slabSchema = new mongoose.Schema(
    {
        thresholdAmount: { type: Number, required: true, min: 0 },
        reward: { type: rewardSchema, required: true },
    },
    { _id: false }
);

const slabBasedSchema = new mongoose.Schema(
    {
        slabs: {
            type: [slabSchema],
            required: true,
            validate: [(value) => Array.isArray(value) && value.length > 0, "At least one slab is required"],
        },
    },
    { _id: false }
);

const newPartySchema = new mongoose.Schema(
    {
        purchaseAmount: { type: Number, required: true, min: 0 },
        normalGiftQuantity: { type: Number, required: true, min: 1 },
        newPartyGiftQuantity: { type: Number, required: true, min: 1 },
        gift: { type: giftRefSchema, required: true },
    },
    { _id: false }
);

const targetBasedSchema = new mongoose.Schema(
    {
        targetAmount: { type: Number, required: true, min: 0 },
        duration: { type: Number, required: true, min: 1 },
        durationUnit: { type: String, required: true, enum: DURATION_UNITS },
        reward: { type: rewardSchema, required: true },
    },
    { _id: false }
);

const benefitSchema = new mongoose.Schema(
    {
        value: { type: Number, required: true, min: 0 },
        reward: { type: rewardSchema, required: true },
    },
    { _id: false }
);

const dualStockistRetailSchema = new mongoose.Schema(
    {
        stockist: { type: benefitSchema, required: true },
        retail: { type: benefitSchema, required: true },
    },
    { _id: false }
);

const conversionSchema = new mongoose.Schema(
    {
        gift: { type: giftRefSchema, required: true },
        conversionAllowed: { type: Boolean, required: true },
        conversionValue: { type: Number, required: true, min: 0 },
        allowedProductIds: {
            type: [{ type: objectId, ref: "Product" }],
            validate: [(value) => Array.isArray(value) && value.length > 0, "At least one product is required"],
        },
    },
    { _id: false }
);

const schemeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true,
        },
        description: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            required: true,
            enum: SCHEME_TYPES,
        },
        mode: {
            type: String,
            enum: IMMEDIATE_MODES,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },
        startDate: {
            type: Date,
            required: true,
        },
        endDate: {
            type: Date,
            required: true,
        },
        priority: {
            type: Number,
            default: 0,
            min: 0,
        },
        configuration: {
            amountBased: { type: amountBasedSchema },
            productBased: { type: productBasedSchema },
            slabBased: { type: slabBasedSchema },
            newParty: { type: newPartySchema },
            targetBased: { type: targetBasedSchema },
            dualStockistRetail: { type: dualStockistRetailSchema },
            conversion: { type: conversionSchema },
        },
        createdBy: {
            type: objectId,
            ref: "User",
        },
        updatedBy: {
            type: objectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

schemeSchema.index({ status: 1 });
schemeSchema.index({ type: 1, mode: 1 });
schemeSchema.index({ startDate: 1 });
schemeSchema.index({ endDate: 1 });

schemeSchema.pre("validate", function () {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
        this.invalidate("endDate", "Start date must be before end date");
    }
    if (this.type === "IMMEDIATE_ON_BILL" && !this.mode) {
        this.invalidate("mode", "Mode is required for immediate on-bill schemes");
    }
    if (this.type && this.type !== "IMMEDIATE_ON_BILL" && this.mode) {
        this.invalidate("mode", "Mode is only allowed for immediate on-bill schemes");
    }
});

const Scheme = mongoose.model("Scheme", schemeSchema);
Scheme.SCHEME_TYPES = SCHEME_TYPES;
Scheme.IMMEDIATE_MODES = IMMEDIATE_MODES;
Scheme.DURATION_UNITS = DURATION_UNITS;

module.exports = Scheme;
