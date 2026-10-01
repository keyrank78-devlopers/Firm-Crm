const express = require("express");
const router = express.Router();

// Controllers
const { createEmployee, getEmployees, getEmployeeById, updateEmployee, changeEmployeeStatus, createVendor, updateUserPermissions } = require("../controllers/admin.controller");
const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    changeDepartmentStatus
} = require("../controllers/department.controller");
const {
    createDesignation,
    getDesignations,
    getDesignationById,
    getDesignationsByDepartment,
    updateDesignation,
    changeDesignationStatus
} = require("../controllers/designation.controller");
// Middlewares & Validators
const { registerValidator } = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");
const { authenticate, authorize } = require("../middlewares/auth.middleware");
const {
    allowCustomer,
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
} = require("../controllers/customer.controller");
const { createCustomerValidator, updateCustomerValidator } = require("../validators/customer.validator");
const {
    createGiftArticle,
    getGiftArticles,
    getGiftArticleById,
    updateGiftArticle,
    changeGiftArticleStatus,
} = require("../controllers/giftArticle.controller");
const {
    createGiftArticleValidator,
    updateGiftArticleValidator,
    giftArticleStatusValidator,
} = require("../validators/giftArticle.validator");
const {
    createScheme,
    getSchemes,
    getSchemeById,
    updateScheme,
    changeSchemeStatus,
} = require("../controllers/scheme.controller");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management APIs
 */

// All admin routes should be protected for authenticated users with appropriate roles
router.use(authenticate, authorize("ADMIN", "EMPLOYEE", "FIELD_EXECUTIVE"));

// --- Employee Routes ---
/**
 * @swagger
 * /api/v1/admin/employees/create:
 *   post:
 *     summary: Create an Employee
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   locality:
 *                     type: string
 *                   street:
 *                     type: string
 *                   landmark:
 *                     type: string
 *               department:
 *                 type: string
 *                 description: ObjectId of the department
 *               designation:
 *                 type: string
 *                 description: ObjectId of the designation
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post("/employees/create", registerValidator, validate, createEmployee);

/**
 * @swagger
 * /api/v1/admin/employees/list:
 *   get:
 *     summary: Get all Employees
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by Department ID
 *       - in: query
 *         name: designation
 *         schema:
 *           type: string
 *         description: Filter by Designation ID
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get("/employees/list", getEmployees);

/**
 * @swagger
 * /api/v1/admin/employees/details/{id}:
 *   get:
 *     summary: Get Employee Details by ID
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee details
 */
router.get("/employees/details/:id", getEmployeeById);

/**
 * @swagger
 * /api/v1/admin/employees/update/{id}:
 *   patch:
 *     summary: Update an Employee
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: object
 *               role:
 *                 type: string
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Employee updated
 */
router.patch("/employees/update/:id", updateEmployee);

/**
 * @swagger
 * /api/v1/admin/employees/status/{id}:
 *   patch:
 *     summary: Change Employee Status (Soft Delete)
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/employees/status/:id", changeEmployeeStatus);
router.put("/users/:id/permissions", updateUserPermissions);

// --- Vendor Routes ---
/**
 * @swagger
 * /api/v1/admin/vendors/create:
 *   post:
 *     summary: Create a Vendor
 *     tags: [Admin - Vendors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   locality:
 *                     type: string
 *                   street:
 *                     type: string
 *                   landmark:
 *                     type: string
 *     responses:
 *       201:
 *         description: Vendor created successfully
 */
router.post("/vendors/create", registerValidator, validate, createVendor);

// --- Department Routes ---
/**
 * @swagger
 * /api/v1/admin/departments/create:
 *   post:
 *     summary: Create a Department
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 */
router.post("/departments/create", createDepartment);

/**
 * @swagger
 * /api/v1/admin/departments/list:
 *   get:
 *     summary: Get all Departments
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of Departments
 */
router.get("/departments/list", getDepartments);

/**
 * @swagger
 * /api/v1/admin/departments/details/{id}:
 *   get:
 *     summary: Get Department by ID
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department details
 */
router.get("/departments/details/:id", getDepartmentById);

/**
 * @swagger
 * /api/v1/admin/departments/update/{id}:
 *   patch:
 *     summary: Update Department
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated
 */
router.patch("/departments/update/:id", updateDepartment);

/**
 * @swagger
 * /api/v1/admin/departments/status/{id}:
 *   patch:
 *     summary: Change Department Status
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/departments/status/:id", changeDepartmentStatus);

// --- Designation Routes ---
/**
 * @swagger
 * /api/v1/admin/designations/create:
 *   post:
 *     summary: Create a Designation
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *                 description: ObjectId of the department
 *     responses:
 *       201:
 *         description: Designation created
 */
router.post("/designations/create", createDesignation);

/**
 * @swagger
 * /api/v1/admin/designations/list:
 *   get:
 *     summary: Get all Designations
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by Department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of Designations
 */
router.get("/designations/list", getDesignations);

/**
 * @swagger
 * /api/v1/admin/designations/details/{id}:
 *   get:
 *     summary: Get Designation by ID
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Designation details
 */
router.get("/designations/details/:id", getDesignationById);

/**
 * @swagger
 * /api/v1/admin/designations/list/department/{departmentId}:
 *   get:
 *     summary: Get Designations by Department ID
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of Designations
 */
router.get("/designations/list/department/:departmentId", getDesignationsByDepartment);

/**
 * @swagger
 * /api/v1/admin/designations/update/{id}:
 *   patch:
 *     summary: Update Designation
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Designation updated
 */
router.patch("/designations/update/:id", updateDesignation);

/**
 * @swagger
 * /api/v1/admin/designations/status/{id}:
 *   patch:
 *     summary: Change Designation Status
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/designations/status/:id", changeDesignationStatus);

// --- Category Routes ---
const { createCategory, getCategoryById, updateCategory, changeCategoryStatus } = require("../controllers/category.controller");
const upload = require("../config/cloudinary");

/**
 * @swagger
 * /api/v1/admin/categories/details/{id}:
 *   get:
 *     summary: Get Category Details by ID
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 */
router.get("/categories/details/:id", getCategoryById);

/**
 * @swagger
 * /api/v1/admin/categories/create:
 *   post:
 *     summary: Create a Category
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/categories/create", upload.single("picture"), createCategory);

/**
 * @swagger
 * /api/v1/admin/categories/update/{id}:
 *   patch:
 *     summary: Update Category
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch("/categories/update/:id", upload.single("picture"), updateCategory);

/**
 * @swagger
 * /api/v1/admin/categories/status/{id}:
 *   patch:
 *     summary: Change Category Status
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/categories/status/:id", changeCategoryStatus);



// --- SubCategory Routes ---
const { createSubCategory, getSubCategoryById, updateSubCategory, changeSubCategoryStatus } = require("../controllers/subcategory.controller");

/**
 * @swagger
 * /api/v1/admin/subcategories/details/{id}:
 *   get:
 *     summary: Get SubCategory Details by ID
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SubCategory details
 */
router.get("/subcategories/details/:id", getSubCategoryById);

/**
 * @swagger
 * /api/v1/admin/subcategories/create:
 *   post:
 *     summary: Create a SubCategory
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID or Name
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: SubCategory created
 */
router.post("/subcategories/create", upload.single("image"), createSubCategory);

/**
 * @swagger
 * /api/v1/admin/subcategories/update/{id}:
 *   patch:
 *     summary: Update SubCategory
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID or Name
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: SubCategory updated
 */
router.patch("/subcategories/update/:id", upload.single("image"), updateSubCategory);

/**
 * @swagger
 * /api/v1/admin/subcategories/status/{id}:
 *   patch:
 *     summary: Change SubCategory Status
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/subcategories/status/:id", changeSubCategoryStatus);



// --- Product Routes ---
const { createProduct, updateProduct, updateProductStock, changeProductStatus } = require("../controllers/product.controller");

/**
 * @swagger
 * /api/v1/admin/products/create:
 *   post:
 *     summary: Create a Product
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID or Name
 *               subCategory:
 *                 type: string
 *                 description: SubCategory ID or Name
 *               mrp:
 *                 type: number
 *               sellPrice:
 *                 type: number
 *               minSalesPrice:
 *                 type: number
 *                 description: Optional minimum sales price
 *               maxSalesPrice:
 *                 type: number
 *                 description: Optional maximum sales price
 *               description:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeyword:
 *                 type: string
 *               variants:
 *                 type: string
 *                 description: JSON stringified array of objects e.g., [{"key":"Size","value":"XL"}]
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Primary product image
 *               otherImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (up to 5)
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
    "/products/create",
    upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "otherImages", maxCount: 5 }
    ]),
    createProduct
);

/**
 * @swagger
 * /api/v1/admin/products/update/{id}:
 *   patch:
 *     summary: Update Product
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               mrp:
 *                 type: number
 *               sellPrice:
 *                 type: number
 *               minSalesPrice:
 *                 type: number
 *                 description: Optional minimum sales price
 *               maxSalesPrice:
 *                 type: number
 *                 description: Optional maximum sales price
 *               description:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeyword:
 *                 type: string
 *               variants:
 *                 type: string
 *               mainImage:
 *                 type: string
 *                 format: binary
 *               otherImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch(
    "/products/update/:id",
    upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "otherImages", maxCount: 5 }
    ]),
    updateProduct
);

/**
 * @swagger
 * /api/v1/admin/products/status/{id}:
 *   patch:
 *     summary: Change Product Status
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/products/status/:id", changeProductStatus);
router.patch("/products/stock/:id", updateProductStock);

// Customers (leads). Admin and Field Executive always pass.
// A sales manager (or any employee) can do an action only after admin grants that permission.
router.post("/customers", allowCustomer("CREATE_CUSTOMERS"), createCustomerValidator, validate, createCustomer);
router.get("/customers", allowCustomer("VIEW_CUSTOMERS"), getCustomers);
router.get("/customers/:id", allowCustomer("VIEW_CUSTOMERS"), getCustomerById);
router.put("/customers/:id", allowCustomer("EDIT_CUSTOMERS"), updateCustomerValidator, validate, updateCustomer);
router.delete("/customers/:id", allowCustomer("DELETE_CUSTOMERS"), deleteCustomer);

/**
 * @swagger
 * /api/v1/admin/gift-articles:
 *   post:
 *     summary: Create a gift article
 *     tags: [Admin - Gift Articles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, source]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *               value:
 *                 type: number
 *               source:
 *                 type: string
 *                 enum: [INTERNAL_STOCK, EXTERNAL_PURCHASE, CUSTOM]
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       201:
 *         description: Gift article created
 *   get:
 *     summary: List gift articles
 *     tags: [Admin - Gift Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [INTERNAL_STOCK, EXTERNAL_PURCHASE, CUSTOM]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Gift article list
 * /api/v1/admin/gift-articles/{id}:
 *   get:
 *     summary: Get gift article
 *     tags: [Admin - Gift Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gift article
 *   patch:
 *     summary: Update gift article
 *     tags: [Admin - Gift Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Gift article updated
 * /api/v1/admin/gift-articles/{id}/status:
 *   patch:
 *     summary: Change gift article status
 *     tags: [Admin - Gift Articles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 * /api/v1/admin/schemes:
 *   post:
 *     summary: Create a scheme
 *     tags: [Admin - Schemes]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code, type, startDate, endDate, configuration]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [IMMEDIATE_ON_BILL, NEW_PARTY_FIRST_PURCHASE, TARGET_BASED, DUAL_STOCKIST_RETAIL, GIFT_TO_PRODUCT_CONVERSION]
 *               mode:
 *                 type: string
 *                 enum: [AMOUNT, PRODUCT, SLAB]
 *                 description: Required only for IMMEDIATE_ON_BILL. One scheme uses one mode.
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               priority:
 *                 type: integer
 *               configuration:
 *                 type: object
 *                 description: Send only the object for the selected type and mode.
 *     responses:
 *       201:
 *         description: Scheme created
 *   get:
 *     summary: List schemes
 *     tags: [Admin - Schemes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [AMOUNT, PRODUCT, SLAB]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Schemes whose end date is on or after this date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Schemes whose start date is on or before this date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Scheme list
 * /api/v1/admin/schemes/{id}:
 *   get:
 *     summary: Get scheme
 *     tags: [Admin - Schemes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scheme
 *   patch:
 *     summary: Update scheme
 *     tags: [Admin - Schemes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Scheme updated
 * /api/v1/admin/schemes/{id}/status:
 *   patch:
 *     summary: Change scheme status
 *     tags: [Admin - Schemes]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.post("/gift-articles", createGiftArticleValidator, validate, createGiftArticle);
router.get("/gift-articles", getGiftArticles);
router.get("/gift-articles/:id", getGiftArticleById);
router.patch("/gift-articles/:id", updateGiftArticleValidator, validate, updateGiftArticle);
router.patch("/gift-articles/:id/status", giftArticleStatusValidator, validate, changeGiftArticleStatus);

router.post("/schemes", createScheme);
router.get("/schemes", getSchemes);
router.get("/schemes/:id", getSchemeById);
router.patch("/schemes/:id", updateScheme);
router.patch("/schemes/:id/status", changeSchemeStatus);

module.exports = router;
