const mongoose = require("mongoose");

const VideoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference the user
  title: String,
  videoUrl: String,
  privacy: String,
  description: String,
  category: String,
  views: { type: Number, default: 0 },
  uploadedAt: { type: Date, default: Date.now },
  thumbnailUrl: String,
});

module.exports = mongoose.model("Video", VideoSchema);
