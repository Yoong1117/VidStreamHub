const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const UserModel = require("./models/User");
const VideoModel = require("./models/Video");
const LikeModel = require("./models/Like");
const CommentModel = require("./models/Comment");
const HistoryModel = require("./models/History");
const FollowerModel = require("./models/Follower");

require('dotenv').config();
const SECRET_KEY = process.env.JWT_SECRET;

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGODB_URL).then(() => {
  console.log("Connected to MongoDB Atlas");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dzrl3jo6x",
  api_key: "372866422935185",
  api_secret: "kumV41y6T46QEHN1UKkmLm1Y-lI",
});

// Path
const user = "/api/user";
const video = "/api/video";
const like = "/api/like";
const comment = "/api/comment";
const history = "/api/history";
const follower = "/api/follower";

// Configure Multer for video and thumbnail upload
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage }).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// Configure Multer for profile picture upload
const storage_pic = multer.memoryStorage();
const upload_pic = multer({ storage_pic }).single("file");

// Middleware to verify JWT token
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }
    req.userId = decoded.userId;
    next();
  });
};

// Extract URL from Video Public ID
function extractPublicIdFromUrl(url) {
  const match = url.match(/\/video_thumbnails\/(.+)\.(jpg|png|jpeg|webp)/);
  return match ? `video_thumbnails/${match[1]}` : null;
}

// User Login
app.post(`${user}/login`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      SECRET_KEY,
      { expiresIn: "10h" }
    );

    res.json({
      token,
      username: user.username,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});

// User Registration
app.post(`${user}/register`, async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingEmail = await UserModel.findOne({ email });
    const existingUsername = await UserModel.findOne({ username });

    if (existingEmail) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (existingUsername) {
      return res.status(400).json({ message: "Username already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await UserModel.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch userId by username
app.get(`${user}/getIdByUsername/:username`, async (req, res) => {
  try {
    const { username } = req.params;
    const user = await UserModel.findOne({ username }); // Find user by username
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ userId: user._id });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get User Profile by username
app.get(`${user}/profile/username/:username`, async (req, res) => {
  const { username } = req.params; // Get the username from the query parameter

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const user = await UserModel.findOne({ username }); // Search for user by username

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const defaultProfilePic = "https://res.cloudinary.com/dzrl3jo6x/image/upload/profile_dxzkob";
    
    res.status(200).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || defaultProfilePic, // Return the profile pic or default
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get User Profile by userId
app.get(`${user}/profile/:userId`, async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ message: "UserId is required" });
  }

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const defaultProfilePic = "https://res.cloudinary.com/dzrl3jo6x/image/upload/profile_dxzkob";
    
    res.status(200).json({
      userId: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic || defaultProfilePic,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Upload and Update Profile Picture and URL
app.put(`${user}/profile-pic`, authenticate, upload_pic, async (req, res) => {
  const { file } = req;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    // Upload profile picture to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload_stream(
      { resource_type: "image", public_id: `profile_pics/${req.userId}` },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Error uploading image to Cloudinary", error });
        }

        // Save the image URL to the user's profile in MongoDB
        const updatedUser = await UserModel.findByIdAndUpdate(
          req.userId,
          { profilePic: result.secure_url },
          { new: true }
        );

        res.status(200).json({ message: "Profile picture updated successfully!", user: updatedUser });
      }
    );
    uploadResponse.end(file.buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error during profile picture upload", error });
  }
});

// Update Username
app.put(`${user}/username`, authenticate, async (req, res) => {
  const { username } = req.body;
  const userId = req.userId;

  try {
    const user = await UserModel.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.username !== username) {
      const oldUsername = user.username;
      user.username = username;
      await user.save();

      // Update username field in videos
      const updateRoot = await VideoModel.updateMany(
        { username: oldUsername },
        { $set: { username: username } }
      );

      return res.status(200).json({
        message: "Username updated successfully in user, videos",
        updatedVideoUsernames: updateRoot.modifiedCount
      });
    }

    return res.status(400).json({ message: "New username is the same as the current one" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error updating username" });
  }
});

// Upload Video and Thumbnail
app.post(`${video}/upload-video`, upload, async (req, res) => {
  const { username, title, privacy, description, category } = req.body;
  const videoFile = req.files?.video?.[0];
  const thumbnailFile = req.files?.thumbnail?.[0];

  if (!title || !videoFile) {
    return res.status(400).json({ message: "Title and video file are required." });
  }

  try {
    // Fetch the user by username to get the userId
    const user = await UserModel.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Upload video to Cloudinary
    const videoUploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video" },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(videoFile.buffer);
    });

    const videoUrl = videoUploadResponse.secure_url;

    let thumbnailUrl = null;
    if (thumbnailFile) {
      // Upload thumbnail to Cloudinary (if provided)
      const thumbUploadResponse = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (err, thumbResult) => {
            if (err) {
              reject(err);
            } else {
              resolve(thumbResult);
            }
          }
        ).end(thumbnailFile.buffer);
      });

      thumbnailUrl = thumbUploadResponse.secure_url;
    }

    // Save video metadata to MongoDB
    const newVideo = new VideoModel({
      user: user._id, // Reference to the user ID
      title,
      videoUrl,
      privacy,
      description,
      category,
      views: 0,
      uploadedAt: new Date(),
      thumbnailUrl, // Thumbnail URL if provided
    });

    await newVideo.save();
    res.status(201).json({ message: "Video uploaded successfully!", video: newVideo });
  } catch (error) {
    res.status(500).json({ message: "Server error during upload", error });
  }
});

// Fetch all videos randomly
app.get(`${video}/data`, async (req, res) => {
  try {
    const videos = await VideoModel.find({ privacy: "public" });
    
    // Shuffle videos randomly
    const shuffledVideos = videos.sort(() => Math.random() - 0.5);

    res.status(200).json(shuffledVideos);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch videos by userId
app.get(`${video}/user/:userId`, async (req, res) => {
  try {
    const { userId } = req.params;
    const videos = await VideoModel.find({ user: userId }).sort({ uploadedAt: -1 }); // latest first
    res.status(200).json(videos);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Fetch video details
app.get(`${video}/:id/details`, async (req, res) => {
  try {
    const { id } = req.params;
    const video = await VideoModel.findById(id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    res.status(200).json(video);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Increment view count
app.post(`${video}/:id/view`, async (req, res) => {
  try {
    const { id } = req.params;
    const video = await VideoModel.findById(id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    video.views += 1;
    await video.save();

    res.status(200).json({ message: "View counted", views: video.views });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get likes and dislikes count for a video
app.get(`${video}/:id/like-dislike-count`, async (req, res) => {
  try {
    const { id } = req.params;

    const likes = await LikeModel.countDocuments({ video: id, isLike: true });
    const dislikes = await LikeModel.countDocuments({ video: id, isLike: false });

    res.status(200).json({ likes, dislikes });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch likes/dislikes", error });
  }
});

// Get like/dislike status
app.get(`${video}/:id/like-status`, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.query;

    const user = await UserModel.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const like = await LikeModel.findOne({ user: user._id, video: id });

    res.json({
      liked: like?.isLike === true,
      disliked: like?.isLike === false,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Like Video 
app.post(`${video}/:id/like`, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const user = await UserModel.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const video = await VideoModel.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const existing = await LikeModel.findOne({ user: user._id, video: id });

    if (existing) {
      if (existing.isLike) {
        // If already liked, remove it (toggle off)
        await LikeModel.deleteOne({ _id: existing._id });
      } else {
        // If previously disliked, switch to like
        existing.isLike = true;
        await existing.save();
      }
    } else {
      // Create new like
      await LikeModel.create({ user: user._id, video: id, isLike: true });
    }

    // Return updated counts
    const likes = await LikeModel.countDocuments({ video: id, isLike: true });
    const dislikes = await LikeModel.countDocuments({ video: id, isLike: false });

    res.status(200).json({ likes, dislikes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Dislike Video
app.post(`${video}/:id/dislike`, async (req, res) => {
  try {
    const { id } = req.params;
    const { username } = req.body;

    const user = await UserModel.findOne({ username });
    if (!user) return res.status(404).json({ message: "User not found" });

    const video = await VideoModel.findById(id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const existing = await LikeModel.findOne({ user: user._id, video: id });

    if (existing) {
      if (!existing.isLike) {
        // If already disliked, remove it (toggle off)
        await LikeModel.deleteOne({ _id: existing._id });
      } else {
        // If previously liked, switch to dislike
        existing.isLike = false;
        await existing.save();
      }
    } else {
      // Create new dislike
      await LikeModel.create({ user: user._id, video: id, isLike: false });
    }

    // Return updated counts
    const likes = await LikeModel.countDocuments({ video: id, isLike: true });
    const dislikes = await LikeModel.countDocuments({ video: id, isLike: false });

    res.status(200).json({ likes, dislikes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get all comments for a video
app.get(`${comment}/:videoId/get-comment`, async (req, res) => {
  const { videoId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    return res.status(400).json({ message: "Invalid video ID format." });
  }

  try {
    const comments = await CommentModel.find({ video: videoId }).populate("user", "username profilePic");
    res.status(200).json({ comments });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Add a new comment to a video
app.post(`${comment}/:videoId/add-comment`, async (req, res) => {
  const { videoId } = req.params;
  const { username, text } = req.body;

  try {
    const user = await UserModel.findOne({ username });
    const video = await VideoModel.findById(videoId);

    if (!user || !video) {
      return res.status(400).json({ message: "Invalid user or video." });
    }

    // Create a new comment and wait for it to be saved in the database
    const newComment = await CommentModel.create({
      user: user._id,
      video: video._id,
      text,
    });

    // Check if the new comment was successfully added
    if (newComment) {
      // Optionally, fetch all comments for this video if you want to return them
      const comments = await CommentModel.find({ video: video._id }).populate("user", "username profilePic");
      return res.status(201).json({ message: "Comment added successfully.", comments });
    } else {
      return res.status(500).json({ message: "Failed to add comment." });
    }
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Delete a comment
app.delete(`${comment}/:commentId/delete-comment`, async (req, res) => {
  const { commentId } = req.params;
  const { username } = req.query;

  try {
    const comment = await CommentModel.findById(commentId).populate("user");

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if the requesting user is the comment owner
    if (comment.user.username !== username) {
      return res.status(403).json({ error: "Unauthorized to delete this comment" });
    }

    await CommentModel.findByIdAndDelete(commentId);
    res.json({ success: true, message: "Comment deleted" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Edit a comment
app.put(`${comment}/:commentId/edit-comment`, async (req, res) => {
  const { commentId } = req.params;
  const { username, text } = req.body;

  try {
    const comment = await CommentModel.findById(commentId).populate("user");

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.user.username !== username) {
      return res.status(403).json({ error: "Unauthorized to edit this comment" });
    }

    comment.text = text;
    await comment.save();

    res.json({ success: true, comment });
  } catch (err) {
    console.error("Error editing comment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Video
app.delete(`${video}/:id`, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the video in MongoDB
    const video = await VideoModel.findById(id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Extract Cloudinary URLs
    const videoPublicId = video.videoUrl.split("/").pop().split(".")[0]; // Extract public ID from URL
    const thumbnailPublicId = video.thumbnailUrl
      ? video.thumbnailUrl.split("/").pop().split(".")[0]
      : null;

    // Delete video from Cloudinary
    await cloudinary.uploader.destroy(videoPublicId, { resource_type: "video" });

    // Delete thumbnail from Cloudinary (if exists)
    if (thumbnailPublicId) {
      await cloudinary.uploader.destroy(thumbnailPublicId);
    }

    // Remove from MongoDB
    await VideoModel.findByIdAndDelete(id);

    res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete video", error });
  }
});

// Upload thumbnail to Cloudinary
app.post(`${video}/upload-thumbnail`, upload_pic, async (req, res) => {
  const { file } = req;
  const oldThumbnailUrl = req.body.oldThumbnailUrl;

  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  try {
    // Optional: Delete old thumbnail from Cloudinary
    if (oldThumbnailUrl) {
      const publicId = extractPublicIdFromUrl(oldThumbnailUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    // Upload new thumbnail
    cloudinary.uploader.upload_stream(
      { resource_type: "image", public_id: `video_thumbnails/${req.userId}_${Date.now()}` },
      async (error, result) => {
        if (error) {
          return res.status(500).json({ message: "Error uploading image to Cloudinary", error });
        }
        res.status(200).json({ thumbnailUrl: result.secure_url });
      }
    ).end(file.buffer);
  } catch (error) {
    res.status(500).json({ message: "Server error during thumbnail upload", error });
  }
});

// Update video datails (including thumbnail URL)
app.put(`${video}/update-thumbnail/:id`, async (req, res) => {
  const { id } = req.params;
  const { title, privacy, category, description, thumbnailUrl } = req.body;

  try {
    const updatedVideo = await VideoModel.findByIdAndUpdate(
      id,
      { title, privacy, category, description, thumbnailUrl },
      { new: true }
    );
    res.status(200).json(updatedVideo);
  } catch (error) {
    res.status(500).json({ message: "Error updating video", error });
  }
});

// Fetch videos based on category
app.get(`${video}/category/:type`, async (req, res) => {
  const { type } = req.params;
  try {
    const videos = await VideoModel.aggregate([
      { $match: { category: `${type}` } },
      { $addFields: { randomSort: { $rand: {} } } },
      { $sort: { randomSort: 1 } },
    ]);

    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch gaming videos" });
  }
});

// Update watch history
app.post(`${history}/update`, authenticate, async (req, res) => {
  const { videoId } = req.body;
  const userId = req.userId;

  try {
    const existing = await HistoryModel.findOne({ user: userId, video: videoId });
    if (existing) {
      existing.watchedAt = new Date();
      await existing.save();
    } else {
      await HistoryModel.create({ user: userId, video: videoId });
    }

    res.json({ message: "History updated" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update history" });
  }
});

// Get user watch history
app.get(`${history}/get-history`, authenticate, async (req, res) => {
  const userId = req.userId;

  try {
    const history = await HistoryModel.find({ user: userId })
      .populate("video")
      .sort({ watchedAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

// Clear history
app.delete(`${history}/clear-history`, authenticate, async (req, res) => {
  const userId = req.userId;
  try {
    await HistoryModel.deleteMany({ user: userId });
    res.json({ message: "History cleared" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// Get follower count
app.get(`${follower}/:userId/count`, async (req, res) => {
  try {
    const count = await FollowerModel.countDocuments({ following: req.params.userId });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch follower count" });
  }
});

// Add user as follower
app.post(`${follower}/add/:targetUserId`, async (req, res) => {
  const { followerId } = req.body;
  const { targetUserId } = req.params;

  if (followerId === targetUserId) {
    return res.status(400).json({ message: "Cannot follow yourself." });
  }

  try {
    await FollowerModel.create({ follower: followerId, following: targetUserId });
    res.status(201).json({ message: "Followed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to follow user." });
  }
});

// Delete (unfollow) a user
app.delete(`${follower}/delete/:targetUserId`, async (req, res) => {
  const { followerId } = req.body;
  const { targetUserId } = req.params;

  try {
    await FollowerModel.deleteOne({ follower: followerId, following: targetUserId });
    res.json({ message: "Unfollowed successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to unfollow user." });
  }
});

// Check follower status
app.get(`${follower}/:targetUserId/isFollowing/:currentUserId`, async (req, res) => {
  const { targetUserId, currentUserId } = req.params;

  try {
    const isFollowing = await FollowerModel.exists({
      follower: currentUserId,
      following: targetUserId,
    });

    res.json({ isFollowing: !!isFollowing });
  } catch (err) {
    res.status(500).json({ message: "Failed to check follow status." });
  }
});

// Start Server
app.listen(process.env.PORT || 3001, () => {
  console.log("Server is running");
});
