const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
  },
  about: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isListed: { type: Boolean, default: true },
});

  const Category = mongoose.model("Category", categorySchema);

  module.exports = Category;
