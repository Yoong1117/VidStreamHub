const mongoose = require("mongoose");

const LikeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
  isLike: Boolean // true = like, false = dislike
});

module.exports = mongoose.model("Like", LikeSchema);
