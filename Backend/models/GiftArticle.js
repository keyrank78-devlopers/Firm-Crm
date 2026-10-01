const mongoose = require("mongoose");

const GIFT_SOURCES = ["INTERNAL_STOCK", "EXTERNAL_PURCHASE", "CUSTOM"];

const giftArticleSchema = new mongoose.Schema(
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
            trim: true,
        },
        value: {
            type: Number,
            min: 0,
        },
        source: {
            type: String,
            required: true,
            enum: GIFT_SOURCES,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

giftArticleSchema.index({ status: 1 });
giftArticleSchema.index({ source: 1 });

const GiftArticle = mongoose.model("GiftArticle", giftArticleSchema);
GiftArticle.GIFT_SOURCES = GIFT_SOURCES;

module.exports = GiftArticle;
