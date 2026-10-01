const mongoose = require("mongoose");
const Scheme = require("../models/Scheme");
const GiftArticle = require("../models/GiftArticle");
const Product = require("../models/Product");
const { parseScheme, parseSchemeUpdate } = require("../validators/scheme.validator");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit) => {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    return { pageNum, limitNum, skip };
};

const userSelect = "name email userType role";
const giftSelect = "name code type value source status";
const productSelect = "name productId productCode mrp sellPrice status";

const populateScheme = (query) => query
    .populate({ path: "createdBy", select: userSelect })
    .populate({ path: "updatedBy", select: userSelect })
    .populate({ path: "configuration.amountBased.reward.giftArticle", select: giftSelect })
    .populate({ path: "configuration.amountBased.reward.product", select: productSelect })
    .populate({ path: "configuration.productBased.product", select: productSelect })
    .populate({ path: "configuration.productBased.reward.giftArticle", select: giftSelect })
    .populate({ path: "configuration.productBased.reward.product", select: productSelect })
    .populate({ path: "configuration.slabBased.slabs.reward.giftArticle", select: giftSelect })
    .populate({ path: "configuration.slabBased.slabs.reward.product", select: productSelect })
    .populate({ path: "configuration.newParty.gift.giftArticle", select: giftSelect })
    .populate({ path: "configuration.newParty.gift.product", select: productSelect })
    .populate({ path: "configuration.targetBased.reward.giftArticle", select: giftSelect })
    .populate({ path: "configuration.targetBased.reward.product", select: productSelect })
    .populate({ path: "configuration.dualStockistRetail.stockist.reward.giftArticle", select: giftSelect })
    .populate({ path: "configuration.dualStockistRetail.stockist.reward.product", select: productSelect })
    .populate({ path: "configuration.dualStockistRetail.retail.reward.giftArticle", select: giftSelect })
    .populate({ path: "configuration.dualStockistRetail.retail.reward.product", select: productSelect })
    .populate({ path: "configuration.conversion.gift.giftArticle", select: giftSelect })
    .populate({ path: "configuration.conversion.gift.product", select: productSelect })
    .populate({ path: "configuration.conversion.allowedProductIds", select: productSelect });

const validationError = (res, errors) => res.status(400).json({
    success: false,
    message: "Validation Error",
    errors,
});

const invalidId = (res) => res.status(400).json({ success: false, message: "Invalid scheme ID format" });

const assertRefs = async (refs) => {
    const giftIds = [...new Set(refs.giftArticles.map((item) => item.id))];
    const productIds = [...new Set(refs.products.map((item) => item.id))];

    const [gifts, products] = await Promise.all([
        giftIds.length ? GiftArticle.find({ _id: { $in: giftIds } }).select("_id").lean() : [],
        productIds.length ? Product.find({ _id: { $in: productIds } }).select("_id").lean() : [],
    ]);

    const giftSet = new Set(gifts.map((item) => String(item._id)));
    const productSet = new Set(products.map((item) => String(item._id)));
    const errors = [];

    refs.giftArticles.forEach((item) => {
        if (!giftSet.has(item.id)) {
            errors.push({ field: item.field, message: "Gift article not found" });
        }
    });
    refs.products.forEach((item) => {
        if (!productSet.has(item.id)) {
            errors.push({ field: item.field, message: "Product not found" });
        }
    });

    return errors;
};

const loadScheme = (id) => populateScheme(Scheme.findById(id)).lean();

const saveScheme = async (id, value, userId) => {
    const update = {
        $set: {
            name: value.name,
            code: value.code,
            type: value.type,
            status: value.status,
            startDate: value.startDate,
            endDate: value.endDate,
            priority: value.priority,
            configuration: value.configuration,
            updatedBy: userId,
        },
        $unset: {},
    };

    if (value.description) update.$set.description = value.description;
    else update.$unset.description = "";

    if (value.mode) update.$set.mode = value.mode;
    else update.$unset.mode = "";

    if (!Object.keys(update.$unset).length) delete update.$unset;

    return populateScheme(
        Scheme.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    ).lean();
};

const createScheme = async (req, res, next) => {
    try {
        const parsed = parseScheme(req.body);
        if (parsed.errors.length) return validationError(res, parsed.errors);

        const taken = await Scheme.findOne({ code: parsed.value.code }).select("_id").lean();
        if (taken) {
            return res.status(409).json({ success: false, message: "A scheme with this code already exists" });
        }

        const refErrors = await assertRefs(parsed.refs);
        if (refErrors.length) return validationError(res, refErrors);

        const scheme = await Scheme.create({
            ...parsed.value,
            createdBy: req.user._id,
            updatedBy: req.user._id,
        });

        const populated = await loadScheme(scheme._id);
        res.status(201).json({ success: true, message: "Scheme created successfully", data: populated });
    } catch (error) {
        next(error);
    }
};

const getSchemes = async (req, res, next) => {
    try {
        const { search, status, type, mode, from, to, page = 1, limit = 10 } = req.query;
        const { pageNum, limitNum, skip } = parsePagination(page, limit);
        const filter = {};

        if (status) {
            if (!["ACTIVE", "INACTIVE"].includes(status)) {
                return res.status(400).json({ success: false, message: "Invalid status. Use ACTIVE or INACTIVE" });
            }
            filter.status = status;
        }

        if (type) {
            if (!Scheme.SCHEME_TYPES.includes(type)) {
                return res.status(400).json({ success: false, message: "Invalid scheme type" });
            }
            filter.type = type;
        }

        if (mode) {
            if (!Scheme.IMMEDIATE_MODES.includes(mode)) {
                return res.status(400).json({ success: false, message: "Invalid mode. Use AMOUNT, PRODUCT, or SLAB" });
            }
            filter.mode = mode;
        }

        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;
        if (from && Number.isNaN(fromDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid from date" });
        }
        if (to && Number.isNaN(toDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid to date" });
        }
        if (fromDate && toDate && fromDate > toDate) {
            return res.status(400).json({ success: false, message: "From date must be before to date" });
        }
        if (fromDate) filter.endDate = { $gte: fromDate };
        if (toDate) filter.startDate = { $lte: toDate };

        if (search && String(search).trim()) {
            const rx = { $regex: escapeRegex(String(search).trim()), $options: "i" };
            filter.$or = [{ name: rx }, { code: rx }, { description: rx }];
        }

        const [total, schemes] = await Promise.all([
            Scheme.countDocuments(filter),
            populateScheme(
                Scheme.find(filter).sort({ priority: 1, createdAt: -1 }).skip(skip).limit(limitNum)
            ).lean(),
        ]);

        res.status(200).json({
            success: true,
            data: schemes,
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

const getSchemeById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return invalidId(res);

        const scheme = await loadScheme(req.params.id);
        if (!scheme) {
            return res.status(404).json({ success: false, message: "Scheme not found" });
        }
        res.status(200).json({ success: true, data: scheme });
    } catch (error) {
        next(error);
    }
};

const updateScheme = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return invalidId(res);

        const existing = await Scheme.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, message: "Scheme not found" });
        }

        const parsed = parseSchemeUpdate(req.body, existing);
        if (parsed.errors.length) return validationError(res, parsed.errors);

        const taken = await Scheme.findOne({ code: parsed.value.code, _id: { $ne: existing._id } }).select("_id").lean();
        if (taken) {
            return res.status(409).json({ success: false, message: "A scheme with this code already exists" });
        }

        const refErrors = await assertRefs(parsed.refs);
        if (refErrors.length) return validationError(res, refErrors);

        const populated = await saveScheme(existing._id, parsed.value, req.user._id);
        res.status(200).json({ success: true, message: "Scheme updated successfully", data: populated });
    } catch (error) {
        next(error);
    }
};

const changeSchemeStatus = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) return invalidId(res);

        const { status } = req.body;
        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status value. Use ACTIVE or INACTIVE" });
        }

        const scheme = await Scheme.findById(req.params.id);
        if (!scheme) {
            return res.status(404).json({ success: false, message: "Scheme not found" });
        }

        scheme.status = status;
        scheme.updatedBy = req.user._id;
        await scheme.save();

        const populated = await loadScheme(scheme._id);
        res.status(200).json({
            success: true,
            message: `Scheme marked as ${status}`,
            data: populated,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createScheme,
    getSchemes,
    getSchemeById,
    updateScheme,
    changeSchemeStatus,
};
