const mongoose = require("mongoose");
const GiftArticle = require("../models/GiftArticle");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit) => {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    return { pageNum, limitNum, skip };
};

const userSelect = "name email userType role";

const populateUsers = (query) => query
    .populate({ path: "createdBy", select: userSelect })
    .populate({ path: "updatedBy", select: userSelect });

const clean = (value) => {
    if (value === undefined || value === null) return undefined;
    const text = String(value).trim();
    return text || undefined;
};

const invalidId = (res) => res.status(400).json({ success: false, message: "Invalid gift article ID format" });

const createGiftArticle = async (req, res, next) => {
    try {
        const code = String(req.body.code).trim().toUpperCase();
        const existing = await GiftArticle.findOne({ code });
        if (existing) {
            return res.status(409).json({ success: false, message: "A gift article with this code already exists" });
        }

        const article = await GiftArticle.create({
            name: String(req.body.name).trim(),
            code,
            description: clean(req.body.description),
            type: clean(req.body.type),
            value: req.body.value === undefined || req.body.value === null || req.body.value === "" ? undefined : Number(req.body.value),
            source: req.body.source,
            status: req.body.status || "ACTIVE",
            createdBy: req.user._id,
            updatedBy: req.user._id,
        });

        const populated = await populateUsers(GiftArticle.findById(article._id)).lean();
        res.status(201).json({ success: true, message: "Gift article created successfully", data: populated });
    } catch (error) {
        next(error);
    }
};

const getGiftArticles = async (req, res, next) => {
    try {
        const { search, status, source, type, page = 1, limit = 10 } = req.query;
        const { pageNum, limitNum, skip } = parsePagination(page, limit);
        const filter = {};

        if (status) {
            if (!["ACTIVE", "INACTIVE"].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status. Use ACTIVE or INACTIVE" });
            }
            filter.status = status;
        }

        if (source) {
            if (!GiftArticle.GIFT_SOURCES.includes(source)) {
                return res.status(400).json({ success: false, message: "Invalid source. Use INTERNAL_STOCK, EXTERNAL_PURCHASE, or CUSTOM" });
            }
            filter.source = source;
        }

        if (type && String(type).trim()) {
            filter.type = { $regex: `^${escapeRegex(String(type).trim())}$`, $options: "i" };
        }

        if (search && String(search).trim()) {
            const rx = { $regex: escapeRegex(String(search).trim()), $options: "i" };
            filter.$or = [{ name: rx }, { code: rx }, { description: rx }];
        }

        const [total, articles] = await Promise.all([
            GiftArticle.countDocuments(filter),
            populateUsers(
                GiftArticle.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum)
            ).lean(),
        ]);

        res.status(200).json({
            success: true,
            data: articles,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum) || 0,
                limit: limitNum,
            },
        });
    } catch (error) {
        next(error);
    }
};

const getGiftArticleById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return invalidId(res);

        const article = await populateUsers(GiftArticle.findById(req.params.id)).lean();
        if (!article) {
            return res.status(404).json({ success: false, message: "Gift article not found" });
        }
        res.status(200).json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
};

const updateGiftArticle = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return invalidId(res);

        const article = await GiftArticle.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ success: false, message: "Gift article not found" });
        }

        const fields = ["name", "code", "description", "type", "value", "source", "status"];
        if (!fields.some((key) => Object.prototype.hasOwnProperty.call(req.body, key))) {
            return res.status(400).json({ success: false, message: "No fields to update" });
        }

        if (req.body.code !== undefined) {
            const code = String(req.body.code).trim().toUpperCase();
            const taken = await GiftArticle.findOne({ code, _id: { $ne: article._id } });
            if (taken) {
                return res.status(409).json({ success: false, message: "A gift article with this code already exists" });
            }
            article.code = code;
        }

        if (req.body.name !== undefined) article.name = String(req.body.name).trim();
        if (req.body.description !== undefined) article.description = clean(req.body.description);
        if (req.body.type !== undefined) article.type = clean(req.body.type);
        if (req.body.value !== undefined) {
            article.value = req.body.value === null || req.body.value === "" ? undefined : Number(req.body.value);
        }
        if (req.body.source !== undefined) article.source = req.body.source;
        if (req.body.status !== undefined) article.status = req.body.status;
        article.updatedBy = req.user._id;

        await article.save();
        const populated = await populateUsers(GiftArticle.findById(article._id)).lean();
        res.status(200).json({ success: true, message: "Gift article updated successfully", data: populated });
    } catch (error) {
        next(error);
    }
};

const changeGiftArticleStatus = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return invalidId(res);

        const article = await GiftArticle.findById(req.params.id);
        if (!article) {
            return res.status(404).json({ success: false, message: "Gift article not found" });
        }

        article.status = req.body.status;
        article.updatedBy = req.user._id;
        await article.save();

        const populated = await populateUsers(GiftArticle.findById(article._id)).lean();
        res.status(200).json({
            success: true,
            message: `Gift article marked as ${article.status}`,
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createGiftArticle,
    getGiftArticles,
    getGiftArticleById,
    updateGiftArticle,
    changeGiftArticleStatus,
};
