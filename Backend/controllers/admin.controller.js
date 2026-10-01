const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const Designation = require("../models/Designation");
const generateId = require("../utils/generateId");

// ─── Helper ───────────────────────────────────────────────────────────────────
// Escapes special regex characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Safe pagination parser — guards against NaN, negative, and absurdly large values
const parsePagination = (page, limit) => {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100); // cap at 100
    const skip = (pageNum - 1) * limitNum;
    return { pageNum, limitNum, skip };
};

// @desc    Create an Employee
// @route   POST /api/v1/admin/employees/create
// @access  Private/Admin
const createEmployee = async (req, res, next) => {
    try {
        const { name, email, phone, password, address, role, department, designation, permissions } = req.body;

        // Validate department ObjectId format before DB call
        if (!mongoose.Types.ObjectId.isValid(department)) {
            return res.status(400).json({ success: false, message: "Invalid department ID format" });
        }
        if (!mongoose.Types.ObjectId.isValid(designation)) {
            return res.status(400).json({ success: false, message: "Invalid designation ID format" });
        }

        // 1. Validate Department exists and is ACTIVE
        const dept = await Department.findById(department);
        if (!dept) {
            return res.status(404).json({ success: false, message: "Department not found" });
        }
        if (dept.status !== "ACTIVE") {
            return res.status(400).json({ success: false, message: "Cannot assign an INACTIVE department" });
        }

        // 2. Validate Designation exists and is ACTIVE
        const desig = await Designation.findById(designation);
        if (!desig) {
            return res.status(404).json({ success: false, message: "Designation not found" });
        }
        if (desig.status !== "ACTIVE") {
            return res.status(400).json({ success: false, message: "Cannot assign an INACTIVE designation" });
        }

        // 3. Validate Designation belongs to Department
        if (desig.department.toString() !== dept._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Validation Error: The selected Designation does not belong to the selected Department",
            });
        }

        // 4. Validate unique email and phone
        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with email or phone already exists" });
        }

        const employeeId = await generateId("EMP");

        const newEmployee = await User.create({
            name, email, phone, password, address,
            userType: "EMPLOYEE",
            employeeId,
            role,
            department: dept._id,
            designation: desig._id,
            permissions,
        });

        res.status(201).json({
            success: true,
            message: "Employee created successfully",
            data: {
                id: newEmployee._id,
                employeeId: newEmployee.employeeId,
                name: newEmployee.name,
                email: newEmployee.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    List Employees
// @route   GET /api/v1/admin/employees/list
// @access  Private/Admin
const getEmployees = async (req, res, next) => {
    try {
        const { department, designation, search, page = 1, limit = 10 } = req.query;
        const { pageNum, limitNum, skip } = parsePagination(page, limit);

        let filter = {};
        if (req.query.userType && req.query.userType !== "ALL") {
            filter.userType = req.query.userType;
        } else {
            filter.userType = { $in: ["EMPLOYEE", "VENDOR"] };
        }

        // Department filter — accept ObjectId or name string
        if (department) {
            if (mongoose.Types.ObjectId.isValid(department)) {
                filter.department = department;
            } else {
                const dept = await Department.findOne({
                    name: { $regex: new RegExp(`^${escapeRegex(department)}$`, "i") },
                });
                filter.department = dept ? dept._id : null;
            }
        }

        // Designation filter — accept ObjectId or name string
        if (designation) {
            if (mongoose.Types.ObjectId.isValid(designation)) {
                filter.designation = designation;
            } else {
                const desig = await Designation.findOne({
                    name: { $regex: new RegExp(`^${escapeRegex(designation)}$`, "i") },
                });
                filter.designation = desig ? desig._id : null;
            }
        }

        // Search by name, email, or phone — regex escaped to prevent ReDoS
        if (search) {
            const safeSearch = escapeRegex(search);
            filter.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { email: { $regex: safeSearch, $options: "i" } },
                { phone: { $regex: safeSearch, $options: "i" } },
            ];
        }

        const [total, employees] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select("-password -refreshToken")
                .populate("department", "name")
                .populate("designation", "name")
                .skip(skip)
                .limit(limitNum)
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            data: employees,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Employee Details by ID
// @route   GET /api/v1/admin/employees/details/:id
// @access  Private/Admin
const getEmployeeById = async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ success: false, message: "Invalid employee ID format" });
        }

        const employee = await User.findOne({ _id: req.params.id, userType: "EMPLOYEE" })
            .select("-password -refreshToken")
            .populate("department", "name")
            .populate("designation", "name");

        if (!employee) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

// @desc    Update Employee
// @route   PATCH /api/v1/admin/employees/update/:id
// @access  Private/Admin
const updateEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phone, address, role, department, designation, permissions } = req.body;

        const employee = await User.findById(id);
        if (!employee || employee.userType !== "EMPLOYEE") {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        if (department && !mongoose.Types.ObjectId.isValid(department)) {
            return res.status(400).json({ success: false, message: "Invalid department ID" });
        }
        if (designation && !mongoose.Types.ObjectId.isValid(designation)) {
            return res.status(400).json({ success: false, message: "Invalid designation ID" });
        }

        if (name) employee.name = name;
        if (phone) employee.phone = phone;
        if (address) employee.address = address;
        if (role) employee.role = role;
        if (department) employee.department = department;
        if (designation) employee.designation = designation;
        if (permissions) employee.permissions = permissions;

        await employee.save();

        res.status(200).json({
            success: true,
            message: "Employee updated successfully",
            data: employee
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Change Employee Status (Soft Delete)
// @route   PATCH /api/v1/admin/employees/status/:id
// @access  Private/Admin
const changeEmployeeStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const employee = await User.findById(id);
        if (!employee || employee.userType !== "EMPLOYEE") {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        employee.status = status;
        await employee.save();

        res.status(200).json({
            success: true,
            message: "Employee status updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create a Vendor
// @route   POST /api/v1/admin/vendors/create
// @access  Private/Admin
const createVendor = async (req, res, next) => {
    try {
        const { name, email, phone, password, address } = req.body;

        const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        if (existingUser) {
            return res.status(409).json({ success: false, message: "User with email or phone already exists" });
        }

        const vendorId = await generateId("VEN");

        const newVendor = await User.create({
            name, email, phone, password, address,
            userType: "VENDOR",
            vendorId,
        });

        res.status(201).json({
            success: true,
            message: "Vendor created successfully",
            data: {
                id: newVendor._id,
                vendorId: newVendor.vendorId,
                name: newVendor.name,
                email: newVendor.email,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update User Permissions
// @route   PUT /api/v1/admin/users/:id/permissions
// @access  Private/Admin
const updateUserPermissions = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { permissions } = req.body;

        if (!Array.isArray(permissions)) {
            return res.status(400).json({ success: false, message: "Permissions must be an array of string keys" });
        }

        const userDoc = await User.findById(id);
        if (!userDoc) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        userDoc.permissions = permissions;
        await userDoc.save();

        res.status(200).json({
            success: true,
            message: "User permissions updated successfully",
            data: {
                id: userDoc._id,
                name: userDoc.name,
                permissions: userDoc.permissions
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createEmployee, getEmployees, getEmployeeById, updateEmployee, changeEmployeeStatus, createVendor, updateUserPermissions };

