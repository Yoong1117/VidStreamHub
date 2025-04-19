const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  profilePic: {
    type: String,
    default: null // Default to null if no profile picture is set
  }
});

const UserModel = mongoose.model("User", UserSchema)
module.exports = UserModel