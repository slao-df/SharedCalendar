// models/Calendar.js
const { Schema, model } = require("mongoose");

const CalendarSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: "#a2b9ee",
  },
  memo: {
    type: String,
    default: "",
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

module.exports = model("Calendar", CalendarSchema);
