const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    line: { type: String, required: true, trim: true },
    villageCity: { type: String, required: true, trim: true },
    tehsil: { type: String, trim: true },
    postOffice: { type: String, trim: true },
    district: { type: String, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
}, { _id: false });

const customerSchema = new mongoose.Schema({
    retailerName: { type: String, required: true, trim: true },
    firmName: { type: String, required: true, trim: true },
    contactNo1: { type: String, required: true, unique: true, trim: true },
    contactNo2: { type: String, trim: true },
    gstin: { type: String, trim: true, uppercase: true },
    dlNo: { type: String, trim: true },
    address: { type: addressSchema, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

customerSchema.index({ retailerName: 1, firmName: 1, gstin: 1 });

const Customer = mongoose.model("Customer", customerSchema);

// Older records used a unique phone field. Drop that index so new customers can be saved.
Customer.collection.dropIndex("phone_1").catch(() => {});

module.exports = Customer;
