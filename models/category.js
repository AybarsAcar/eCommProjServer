const mongoose = require("mongoose");

//create the schema
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
      unique: true,
    },
  },
  { timestamps: true }
);

//exports
module.exports = mongoose.model("Category", categorySchema);
