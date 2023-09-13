const mongoose = require("mongoose");

const schema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
    },
    expirationDate: {
      type: String,
      required: true,
    },
    discount: {
      type: Number,
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Voucher", schema);
