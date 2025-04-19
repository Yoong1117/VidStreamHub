import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import VideoGrid from "../components/VideoGrid";

export default function ProfilePage() {
  const { username: paramUsername } = useParams<{ username: string }>();
  const [videos, setVideos] = useState([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profilePic, setProfilePic] = useState("");
  const [username, setUsername] = useState("");
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null);

  const sessionUsername = sessionStorage.getItem("username");

  const isOwnProfile = !paramUsername || paramUsername === sessionUsername;

  useEffect(() => {
    const fetchLoggedInUserId = async () => {
      if (!sessionUsername) return;
      try {
        const res = await axios.get(
          `http://localhost:3001/api/user/getIdByUsername/${sessionUsername}`
        );
        setLoggedInUserId(res.data.userId);
      } catch (err) {
        console.error("Failed to fetch logged-in user ID:", err);
      }
    };

    fetchLoggedInUserId();
  }, [sessionUsername]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const targetUsername = paramUsername || sessionUsername;
        if (!targetUsername) return;

        const res = await axios.get(
          `http://localhost:3001/api/user/getIdByUsername/${targetUsername}`
        );
        const id = res.data.userId;
        setUserId(id);

        const profileRes = await axios.get(
          `http://localhost:3001/api/user/profile/${id}`
        );
        setProfilePic(profileRes.data.profilePic);
        setUsername(profileRes.data.username);

        const followerRes = await axios.get(
          `http://localhost:3001/api/follower/${id}/count`
        );
        setFollowerCount(followerRes.data.count);

        // Check if logged in user follows the target user
        if (loggedInUserId && loggedInUserId !== id) {
          const isFollowRes = await axios.get(
            `http://localhost:3001/api/follower/${id}/isFollowing/${loggedInUserId}`
          );
          setIsFollowing(isFollowRes.data.isFollowing);
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      }
    };

    fetchProfileData();
  }, [paramUsername, sessionUsername, loggedInUserId]);

  useEffect(() => {
    if (!userId) return;

    axios
      .get(`http://localhost:3001/api/video/user/${userId}`)
      .then((res) => setVideos(res.data))
      .catch((err) => {
        console.error("Failed to fetch videos:", err);
      });
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!userId || !loggedInUserId) return;

    try {
      if (isFollowing) {
        await axios.delete(
          `http://localhost:3001/api/follower/delete/${userId}`,
          {
            data: { followerId: loggedInUserId },
          }
        );
        setIsFollowing(false);
        setFollowerCount((prev) => prev - 1);
      } else {
        await axios.post(`http://localhost:3001/api/follower/add/${userId}`, {
          followerId: loggedInUserId,
        });
        setIsFollowing(true);
        setFollowerCount((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Failed to toggle follow status:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container my-4">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div className="d-flex align-items-center">
            {profilePic && (
              <img
                src={profilePic}
                alt="Profile"
                className="rounded-circle me-3"
                width="80"
                height="80"
                style={{ objectFit: "cover" }}
              />
            )}
            <div>
              <h4 className="mb-1">{username}</h4>
              <p className="text-muted mb-0">
                {followerCount} follower{followerCount !== 1 && "s"} •{" "}
                {videos.length} video{videos.length !== 1 && "s"}
              </p>
            </div>
          </div>
          {!isOwnProfile && (
            <button
              onClick={handleFollowToggle}
              className={`btn ${
                isFollowing ? "btn-outline-secondary" : "btn-primary"
              }`}
            >
              {isFollowing ? "Unfollow" : "Follow"}
            </button>
          )}
        </div>
        <VideoGrid videos={videos} source="myVideos" />
      </div>
    </>
  );
}
