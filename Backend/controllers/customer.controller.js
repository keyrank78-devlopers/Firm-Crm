const Customer = require("../models/Customer");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page, limit) => {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
    const skip = (pageNum - 1) * limitNum;
    return { pageNum, limitNum, skip };
};

const isFieldExecutive = (user) => {
    const role = String(user?.role || "").toUpperCase().replace(/[\s_-]+/g, "");
    return role === "FIELDEXECUTIVE";
};

// Admin always passes. Field executive passes for this module.
// Anyone else passes only when admin has granted that permission
// (for example a sales manager with CREATE_CUSTOMERS).
const allowCustomer = (permission) => (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    if (req.user.userType === "ADMIN" || isFieldExecutive(req.user)) {
        return next();
    }
    const permissions = req.user.permissions || [];
    if (permissions.includes(permission)) {
        return next();
    }
    return res.status(403).json({
        success: false,
        message: "Forbidden — missing required permission",
        code: "PERMISSION_DENIED",
    });
};

const populateCreatedBy = {
    path: "createdBy",
    select: "name email userType role",
};

const text = (value) => (value && String(value).trim()) || undefined;

const buildAddress = (address) => ({
    line: address.line.trim(),
    villageCity: address.villageCity.trim(),
    tehsil: text(address.tehsil),
    postOffice: text(address.postOffice),
    district: text(address.district),
    state: address.state.trim(),
    pincode: String(address.pincode).trim(),
    landmark: text(address.landmark),
});

const createCustomer = async (req, res, next) => {
    try {
        const { retailerName, firmName, contactNo1, contactNo2, gstin, dlNo, address } = req.body;

        const existing = await Customer.findOne({ contactNo1: contactNo1.trim() });
        if (existing) {
            return res.status(409).json({ success: false, message: "A customer with this contact number already exists" });
        }

        const customer = await Customer.create({
            retailerName: retailerName.trim(),
            firmName: firmName.trim(),
            contactNo1: contactNo1.trim(),
            contactNo2: text(contactNo2),
            gstin: text(gstin)?.toUpperCase(),
            dlNo: text(dlNo),
            address: buildAddress(address),
            createdBy: req.user._id,
        });

        const populated = await Customer.findById(customer._id).populate(populateCreatedBy).lean();
        res.status(201).json({ success: true, message: "Customer created", data: populated });
    } catch (error) {
        next(error);
    }
};

const getCustomers = async (req, res, next) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;
        const { pageNum, limitNum, skip } = parsePagination(page, limit);

        const filter = {};
        if (search && String(search).trim()) {
            const rx = { $regex: escapeRegex(String(search).trim()), $options: "i" };
            filter.$or = [
                { retailerName: rx },
                { firmName: rx },
                { contactNo1: rx },
                { contactNo2: rx },
                { gstin: rx },
                { dlNo: rx },
                { "address.line": rx },
                { "address.villageCity": rx },
                { "address.tehsil": rx },
                { "address.postOffice": rx },
                { "address.district": rx },
                { "address.state": rx },
                { "address.pincode": rx },
                { "address.landmark": rx },
            ];
        }

        const [total, customers] = await Promise.all([
            Customer.countDocuments(filter),
            Customer.find(filter)
                .populate(populateCreatedBy)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            data: customers,
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

const getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id).populate(populateCreatedBy).lean();
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.status(200).json({ success: true, data: customer });
    } catch (error) {
        next(error);
    }
};

const updateCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }

        const { retailerName, firmName, contactNo1, contactNo2, gstin, dlNo, address } = req.body;

        if (contactNo1 && contactNo1.trim() !== customer.contactNo1) {
            const taken = await Customer.findOne({ contactNo1: contactNo1.trim(), _id: { $ne: customer._id } });
            if (taken) {
                return res.status(409).json({ success: false, message: "A customer with this contact number already exists" });
            }
            customer.contactNo1 = contactNo1.trim();
        }

        if (retailerName !== undefined) customer.retailerName = retailerName.trim();
        if (firmName !== undefined) customer.firmName = firmName.trim();
        if (contactNo2 !== undefined) customer.contactNo2 = text(contactNo2);
        if (gstin !== undefined) customer.gstin = text(gstin)?.toUpperCase();
        if (dlNo !== undefined) customer.dlNo = text(dlNo);

        if (address) {
            const current = customer.address || {};
            customer.address = {
                line: address.line !== undefined ? address.line.trim() : current.line,
                villageCity: address.villageCity !== undefined ? address.villageCity.trim() : current.villageCity,
                tehsil: address.tehsil !== undefined ? text(address.tehsil) : current.tehsil,
                postOffice: address.postOffice !== undefined ? text(address.postOffice) : current.postOffice,
                district: address.district !== undefined ? text(address.district) : current.district,
                state: address.state !== undefined ? address.state.trim() : current.state,
                pincode: address.pincode !== undefined ? String(address.pincode).trim() : current.pincode,
                landmark: address.landmark !== undefined ? text(address.landmark) : current.landmark,
            };
        }

        await customer.save();
        const populated = await Customer.findById(customer._id).populate(populateCreatedBy).lean();
        res.status(200).json({ success: true, message: "Customer updated", data: populated });
    } catch (error) {
        next(error);
    }
};

const deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findByIdAndDelete(req.params.id);
        if (!customer) {
            return res.status(404).json({ success: false, message: "Customer not found" });
        }
        res.status(200).json({ success: true, message: "Customer deleted" });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    allowCustomer,
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
};
