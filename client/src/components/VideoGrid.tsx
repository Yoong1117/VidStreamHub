import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../css/VideoGrid.css";
import clip_2 from "../assets/clip_2.png";
import empty from "../assets/empty.png";

interface Video {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  views: number;
  uploadedAt: string;
  user: string; // Changed from 'username' to 'user' (userId)
}

interface VideoGridProps {
  videos: Video[];
  source?: "myVideos" | "homepage";
  onDelete?: (videoId: string) => void;
}

const timeAgo = (dateString: string) => {
  const uploaded = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now.getTime() - uploaded.getTime()) / 1000);

  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 31536000) return `${Math.floor(diff / 86400)} days ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

export default function VideoGrid({
  videos,
  source,
  onDelete,
}: VideoGridProps) {
  const navigate = useNavigate();
  const [profilePics, setProfilePics] = useState<{ [userId: string]: string }>(
    {}
  );
  const [usernames, setUsernames] = useState<{ [userId: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);
  const url = "https://vidstreamhub-backend.onrender.com";

  useEffect(() => {
    const uniqueUserIds = [...new Set(videos.map((v) => v.user))];

    // 1. Always fetch uploader info
    Promise.all(
      uniqueUserIds.map((userId) =>
        fetch(`${url}/api/user/profile/${userId}`)
          .then((res) => res.json())
          .then((data) => ({
            userId,
            profilePic: data.profilePic,
            username: data.username,
          }))
          .catch(() => ({
            userId,
            profilePic: null,
            username: "Unknown",
          }))
      )
    ).then((results) => {
      const picMap: { [userId: string]: string } = {};
      const nameMap: { [userId: string]: string } = {};

      results.forEach(({ userId, profilePic, username }) => {
        picMap[userId] =
          profilePic ||
          "https://res.cloudinary.com/dzrl3jo6x/image/upload/profile_dxzkob";
        nameMap[userId] = username;
      });

      setProfilePics(picMap);
      setUsernames(nameMap);
    });

    // 2. Only fetch logged-in user info if token/username exist
    const token = sessionStorage.getItem("token");
    const sessionUsername = sessionStorage.getItem("username");

    if (token && sessionUsername) {
      setIsLoggedIn(true);
      fetch(`${url}/api/user/getIdByUsername/${sessionUsername}`)
        .then((res) => res.json())
        .then((data) => {
          setLoggedInUserId(data.userId);
        })
        .catch((err) => {
          console.error("Failed to fetch logged-in user ID:", err);
        });
    } else {
      setIsLoggedIn(false);
      setLoggedInUserId(null);
    }
  }, [videos]);

  const handleDelete = async (videoId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this video?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `${url}/api/video/${videoId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete video");
      }

      if (source === "myVideos") {
        // Optionally call onDelete prop to update parent
        if (typeof onDelete === "function") {
          onDelete(videoId);
        }
      }

      alert("Video deleted successfully!");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete video.");
    }
  };

  const handleVideoClick = async (videoId: string) => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        await fetch(`${url}/api/history/update`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ videoId }),
        });
      } catch (err) {
        console.error("Failed to update watch history", err);
      }
    }

    navigate(`/video/${videoId}`);
  };

  return (
    <div className="container my-4">
      {/* Section Header */}
      {videos.length > 0 && (
        <h2 className="mb-4">
          {source === "homepage" ? "Explore Videos" : "My Videos"}
        </h2>
      )}

      {/* Empty States */}
      {videos.length === 0 && (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: source === "homepage" ? "50vh" : "60vh" }}
        >
          <div className="text-center p-4">
            <img
              src={source === "homepage" ? empty : clip_2}
              alt={source === "homepage" ? "Empty" : "Clip_2"}
              className={source === "homepage" ? "empty" : "clip_2"}
            />
            <h3 className="mb-3">
              {source === "homepage"
                ? "We do not have any video(s) available yet"
                : "Create and upload your video(s)"}
            </h3>
            {source === "myVideos" && (
              <p className="text-muted">You have not added any video(s) yet</p>
            )}
            {isLoggedIn && (
              <button
                className="btn btn-primary"
                onClick={() => navigate("/uploadpage")}
              >
                {source === "homepage" ? "To Upload Page" : "Upload Video"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="row">
        {videos.map((video) => (
          <div className="col-md-4 mb-4" key={video._id}>
            <div className="card h-100 shadow-sm">
              <div
                role="button"
                onClick={() => handleVideoClick(video._id)}
                style={{ cursor: "pointer" }}
              >
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    className="card-img-top"
                    alt="Thumbnail"
                    height="200"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <video
                    className="card-img-top"
                    height="200"
                    src={video.videoUrl}
                    muted
                  />
                )}
              </div>

              <div className="card-body">
                <Link
                  to={`/video/${video._id}`}
                  style={{ textDecoration: "none", color: "black" }}
                >
                  <h5 className="card-title">{video.title}</h5>
                </Link>

                <p className="card-text text-muted">{video.views} views</p>

                {/* Upload Time + Uploader Info */}
                <p className="card-text text-secondary d-flex align-items-center">
                  {timeAgo(video.uploadedAt)}
                  {source === "homepage" && (
                    <>
                      {" - "}
                      <Link
                        to={`/profilepage/${usernames[video.user]}`}
                        style={{ textDecoration: "none", color: "inherit" }}
                      >
                        <img
                          src={
                            profilePics[video.user] ||
                            "https://res.cloudinary.com/dzrl3jo6x/image/upload/profile_dxzkob"
                          }
                          alt="profile"
                          className="rounded-circle mx-2"
                          width="24"
                          height="24"
                          style={{ objectFit: "cover" }}
                        />
                        {usernames[video.user]}
                      </Link>
                    </>
                  )}
                </p>

                {/* Edit/Delete Buttons */}
                {source === "myVideos" && loggedInUserId === video.user && (
                  <div className="d-flex justify-content-between mt-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/edit-video/${video._id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(video._id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
