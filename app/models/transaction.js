const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  wallet: { type: mongoose.Schema.Types.ObjectId,
     ref: "Wallet" },

  amount: { type: Number, 
    required: true },

  type: { type: String,
     enum: ["debit", "credit"], 
     required: true },
     
  timestamp: { type: Date, 
    default: Date.now },
});

module.exports = mongoose.model("Transaction", transactionSchema);
