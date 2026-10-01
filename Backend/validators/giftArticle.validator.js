const { body } = require("express-validator");
const GiftArticle = require("../models/GiftArticle");

const createGiftArticleValidator = [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("code").trim().notEmpty().withMessage("Code is required"),
    body("description").optional({ nullable: true }).trim(),
    body("type").optional({ nullable: true }).trim().isLength({ max: 80 }).withMessage("Type must be 80 characters or fewer"),
    body("value").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Value must be 0 or more"),
    body("source").isIn(GiftArticle.GIFT_SOURCES).withMessage("Source must be INTERNAL_STOCK, EXTERNAL_PURCHASE, or CUSTOM"),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Status must be ACTIVE or INACTIVE"),
];

const updateGiftArticleValidator = [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("code").optional().trim().notEmpty().withMessage("Code cannot be empty"),
    body("description").optional({ nullable: true }).trim(),
    body("type").optional({ nullable: true }).trim().isLength({ max: 80 }).withMessage("Type must be 80 characters or fewer"),
    body("value").optional({ nullable: true }).isFloat({ min: 0 }).withMessage("Value must be 0 or more"),
    body("source").optional().isIn(GiftArticle.GIFT_SOURCES).withMessage("Source must be INTERNAL_STOCK, EXTERNAL_PURCHASE, or CUSTOM"),
    body("status").optional().isIn(["ACTIVE", "INACTIVE"]).withMessage("Status must be ACTIVE or INACTIVE"),
];

const giftArticleStatusValidator = [
    body("status").isIn(["ACTIVE", "INACTIVE"]).withMessage("Status must be ACTIVE or INACTIVE"),
];

module.exports = {
    createGiftArticleValidator,
    updateGiftArticleValidator,
    giftArticleStatusValidator,
};
