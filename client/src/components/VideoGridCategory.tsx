// src/components/VideoGridCategory.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import empty from "../assets/empty.png";
import "../css/category.css";

interface Video {
  _id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  views: number;
  uploadedAt: string;
  user: string; // userId
}

interface VideoGridCategoryProps {
  category: string;
  source?: string;
}

export default function VideoGridCategory({
  category,
}: VideoGridCategoryProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [profilePics, setProfilePics] = useState<{ [userId: string]: string }>(
    {}
  );
  const [usernames, setUsernames] = useState<{ [userId: string]: string }>({});

  useEffect(() => {
    if (!category) return;

    axios
      .get(`http://localhost:3001/api/video/category/${category}`)
      .then((res) => {
        setVideos(res.data);

        const videoData: Video[] = res.data;
        const uniqueUserIds: string[] = [
          ...new Set(videoData.map((v) => String(v.user))),
        ];

        Promise.all(
          uniqueUserIds.map((userId) =>
            axios
              .get(`http://localhost:3001/api/user/profile/${userId}`)
              .then((res) => ({
                userId,
                profilePic: res.data.profilePic,
                username: res.data.username,
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
      })
      .catch((err) => {
        console.error(`Failed to fetch ${category} videos`, err);
        alert("Failed to load videos.");
      });
  }, [category]);

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

  return (
    <div className="container my-4">
      <h2 className="mb-4">
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </h2>
      {videos.length === 0 ? (
        <div
          className="d-flex justify-content-center align-items-center"
          style={{ height: "70vh" }}
        >
          <div className="text-center p-4">
            <img src={empty} alt="Empty" className="empty" />
            <h3 className="mb-4">There is no video available yet</h3>
          </div>
        </div>
      ) : (
        <>
          <div className="row">
            {videos.map((video) => (
              <div className="col-md-4 mb-4" key={video._id}>
                <div className="card h-100 shadow-sm">
                  <Link to={`/video/${video._id}`}>
                    <img
                      src={video.thumbnailUrl}
                      className="card-img-top"
                      alt={video.title}
                      height="200"
                      style={{ objectFit: "cover" }}
                    />
                  </Link>
                  <div className="card-body">
                    <h5 className="card-title">{video.title}</h5>
                    <p className="card-text text-muted">{video.views} views</p>

                    <p className="card-text text-secondary d-flex align-items-center">
                      {timeAgo(video.uploadedAt)}
                      {" - "}
                      <Link
                        to={`/profilepage/${usernames[video.user]}`}
                        className="d-flex align-items-center ms-2 text-decoration-none text-dark"
                      >
                        <img
                          src={
                            profilePics[video.user] ||
                            "https://res.cloudinary.com/dzrl3jo6x/image/upload/profile_dxzkob"
                          }
                          alt="profile"
                          className="rounded-circle me-2"
                          width="24"
                          height="24"
                          style={{ objectFit: "cover" }}
                        />
                        {usernames[video.user]}
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
