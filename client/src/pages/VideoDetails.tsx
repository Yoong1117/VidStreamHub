import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../css/VideoDetails.css";
import axios from "axios";
import { API_URL } from "../config";

export default function VideoDetails() {
  const { id } = useParams();
  const [video, setVideo] = useState<any>(null);
  const [uploader, setUploader] = useState<any>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentText, setEditedCommentText] = useState<string>("");
  const [commentText, setCommentText] = useState("");
  const [profilePics, setProfilePics] = useState<{
    [username: string]: string;
  }>({});

  const username = sessionStorage.getItem("username");

  function createLinkifiedDescription(description: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return description.replace(
      urlRegex,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      axios.post(`${API_URL}/api/video/${id}/view`).catch((error) => {
        console.error("Error incrementing view count:", error);
      });
    }, 30000); // 30 seconds delay to increase view

    const fetchVideoData = async () => {
      if (!id) return;

      try {
        const videoRes = await axios.get(`${API_URL}/api/video/${id}/details`);
        const videoData = videoRes.data;
        setVideo(videoData);

        // Fetch uploader info
        const userRes = await axios.get(
          `${API_URL}/api/user/profile/${videoData.user}`
        );
        setUploader(userRes.data);

        // Fetch likes/dislikes
        const likeRes = await axios.get(
          `${API_URL}/api/video/${id}/like-dislike-count`
        );
        const likes = likeRes.data.likes;
        const dislikes = likeRes.data.dislikes;
        setLikeCount(likes);
        setDislikeCount(dislikes);

        if (username) {
          const statusRes = await axios.get(
            `${API_URL}/api/video/${id}/like-status`,
            { params: { username } }
          );
          setHasLiked(statusRes.data.liked);
          setHasDisliked(statusRes.data.disliked);
        }

        // Fetch comments
        const commentRes = await axios.get(
          `${API_URL}/api/comment/${id}/get-comment`
        );
        setComments(commentRes.data.comments);

        // Fetch profile pictures of commenters
        for (const comment of commentRes.data.comments) {
          const userId = comment.user._id;
          if (!profilePics[userId]) {
            const picRes = await axios.get(
              `${API_URL}/api/user/profile/${userId}`
            );

            setProfilePics((prev) => ({
              ...prev,
              [userId]: picRes.data.profilePic,
            }));
          }
        }
      } catch (err) {
        console.error("Error fetching video data:", err);
      }
    };

    fetchVideoData();

    return () => clearTimeout(timer); // cleanup if component unmounts
  }, [id, username]);

  const handleLike = async () => {
    if (!username) return alert("You need to be logged in to like videos.");
    try {
      const res = await axios.post(`${API_URL}/api/video/${id}/like`, {
        username,
      });
      setLikeCount(res.data.likes);
      setDislikeCount(res.data.dislikes);
      setHasLiked(true);
      setHasDisliked(false);
    } catch (err) {
      console.error("Failed to like video:", err);
    }
  };

  const handleDislike = async () => {
    if (!username) return alert("You need to be logged in to dislike videos.");
    try {
      const res = await axios.post(`${API_URL}/api/video/${id}/dislike`, {
        username,
      });
      setLikeCount(res.data.likes);
      setDislikeCount(res.data.dislikes);
      setHasLiked(false);
      setHasDisliked(true);
    } catch (err) {
      console.error("Failed to dislike video:", err);
    }
  };

  const handleComment = async () => {
    if (!username) return alert("You need to be logged in to comment.");
    if (commentText.trim() === "") return;

    try {
      // Post comment and wait for full user-resolved comment from backend
      const res = await axios.post(`${API_URL}/api/comment/${id}/add-comment`, {
        username,
        text: commentText,
      });

      const newComments = res.data.comments;
      setComments(newComments);
      setCommentText("");

      // Get the latest comment (assuming the last one is the new one)
      const latestComment = newComments[newComments.length - 1];
      const userId = latestComment.user._id;

      // Only fetch profile pic if not already available
      if (!profilePics[userId]) {
        const picRes = await axios.get(`${API_URL}/api/user/profile/${userId}`);

        setProfilePics((prev) => ({
          ...prev,
          [userId]: picRes.data.profilePic,
        }));
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    }
  };

  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment._id);
    setEditedCommentText(comment.text);
  };

  const submitEditedComment = async () => {
    if (!editingCommentId || editedCommentText.trim() === "") return;

    try {
      await axios.put(`${API_URL}/comment/${editingCommentId}/edit-comment`, {
        text: editedCommentText,
        username,
      });

      // Replace the updated comment in state
      setComments((prev) =>
        prev.map((c) =>
          c._id === editingCommentId ? { ...c, text: editedCommentText } : c
        )
      );
      setEditingCommentId(null);
      setEditedCommentText("");
    } catch (error) {
      console.error("Error editing comment:", error);
      alert("Failed to edit comment.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!username) return;

    try {
      await axios.delete(`${API_URL}/comment/${commentId}/delete-comment`, {
        params: { username },
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("You are not authorized to delete this comment.");
    }
  };

  const timeAgo = (dateString: string) => {
    const uploaded = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - uploaded.getTime()) / 1000);

    const pluralize = (value: number, unit: string) =>
      `${value} ${unit}${value === 1 ? "" : "s"} ago`;

    if (diff < 60) return pluralize(diff, "second");
    if (diff < 3600) return pluralize(Math.floor(diff / 60), "minute");
    if (diff < 86400) return pluralize(Math.floor(diff / 3600), "hour");
    if (diff < 31536000) return pluralize(Math.floor(diff / 86400), "day");
    return pluralize(Math.floor(diff / 31536000), "year");
  };

  if (!video || !uploader) {
    return (
      <>
        <Navbar />
        <div className="container my-4">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container my-4">
        <div className="row">
          <div className="col-md-8">
            {video.videoUrl ? (
              <video
                src={video.videoUrl}
                controls
                className="w-100 mb-3"
                style={{ borderRadius: "10px" }}
              />
            ) : (
              <p>Video not available</p>
            )}

            <div className="row align-items-center mb-3">
              <div className="col-md-8">
                <h4 className="mb-1">{video.title}</h4>
                <p className="text-muted mb-1">
                  {video.views} views • {timeAgo(video.uploadedAt)}
                </p>

                <p className="text-muted">
                  <img
                    src={uploader.profilePic}
                    alt="Profile"
                    className="rounded-circle me-2"
                    width="40"
                    height="40"
                    style={{ objectFit: "cover" }}
                  />
                  {uploader.username}
                </p>
              </div>

              <div className="col-md-4 d-flex justify-content-end">
                <button
                  className={`btn me-2 ${
                    hasLiked ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={handleLike}
                >
                  👍 Like {likeCount}
                </button>
                <button
                  className={`btn ${
                    hasDisliked ? "btn-danger" : "btn-outline-danger"
                  }`}
                  onClick={handleDislike}
                >
                  👎 Dislike {dislikeCount}
                </button>
              </div>
            </div>

            <hr />
            <h5>Description</h5>
            <p
              style={{ whiteSpace: "pre-wrap" }}
              dangerouslySetInnerHTML={{
                __html: createLinkifiedDescription(
                  video.description || "No description available."
                ),
              }}
              className="video-description"
            />

            <hr />
            <h5>Comments</h5>
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button className="btn btn-primary mt-2" onClick={handleComment}>
                Comment
              </button>
            </div>

            {comments.map((comment, index) => (
              <div
                key={index}
                className="mb-3 d-flex align-items-start justify-content-between"
              >
                <div className="d-flex">
                  <div className="me-3 mt-1">
                    <img
                      src={
                        comment.user?._id
                          ? profilePics[comment.user._id]
                          : "/default-avatar.png"
                      }
                      alt="Profile"
                      className="rounded-circle"
                      width="40"
                      height="40"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div>
                    <div className="d-flex align-items-center mb-1">
                      <strong>
                        {comment.user?.username || "Unknown User"}
                      </strong>
                      <span className="text-muted ms-2">
                        {timeAgo(comment.createdAt)}
                      </span>
                    </div>

                    {editingCommentId === comment._id ? (
                      <div>
                        <input
                          type="text"
                          className="form-control mb-1"
                          value={editedCommentText}
                          onChange={(e) => setEditedCommentText(e.target.value)}
                          autoFocus
                        />
                        <button
                          className="btn btn-sm btn-success me-2"
                          onClick={submitEditedComment}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setEditingCommentId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <p className="mb-0">{comment.text}</p>
                    )}
                  </div>
                </div>

                {comment.user?.username === username && (
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-light"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      ⋮
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end text-center custom-dropdown-width">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleEditComment(comment)}
                        >
                          Edit
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => handleDeleteComment(comment._id)}
                        >
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
