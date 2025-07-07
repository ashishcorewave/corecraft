const mongoose = require("mongoose");

const CursorSchema = new mongoose.Schema(
  {
  },
  { strict: false }
);

module.exports = mongoose.model("cursor", CursorSchema);
