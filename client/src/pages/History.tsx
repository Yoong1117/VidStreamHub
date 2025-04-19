import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/VideoGrid.css";
import Navbar from "../components/Navbar";

interface Video {
  _id: string;
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  views: number;
  uploadedAt: string;
  user: string;
}

interface HistoryItem {
  _id: string;
  video: Video;
  watchedAt: string;
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

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      navigate("/signup");
      return;
    }

    fetch("http://localhost:3001/api/history/get-history", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => {
        console.error("Failed to fetch history", err);
        alert("Failed to load history");
      });
  }, [navigate]);

  const clearHistory = () => {
    const token = sessionStorage.getItem("token");
    if (!window.confirm("Are you sure you want to clear your watch history?"))
      return;

    fetch("http://localhost:3001/api/history/clear-history", {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(() => {
        setHistory([]);
        alert("Watch history cleared.");
      })
      .catch((err) => {
        console.error("Failed to clear history", err);
        alert("Error clearing history.");
      });
  };

  return (
    <>
      <Navbar />
      <div className="container my-4">
        <h2 className="mb-3">Watch History</h2>

        {history.length === 0 ? (
          <p className="text-muted">No videos watched yet.</p>
        ) : (
          <>
            <div className="mb-3">
              <button className="btn btn-danger" onClick={clearHistory}>
                Clear All History
              </button>
            </div>

            <div className="row">
              {history.map((item) => (
                <div className="col-md-4 mb-4" key={item._id}>
                  <div className="card h-100 shadow-sm">
                    <Link to={`/video/${item.video._id}`}>
                      {item.video.thumbnailUrl ? (
                        <img
                          src={item.video.thumbnailUrl}
                          className="card-img-top"
                          alt="Thumbnail"
                          height="200"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <video
                          className="card-img-top"
                          height="200"
                          src={item.video.videoUrl}
                          muted
                        />
                      )}
                    </Link>
                    <div className="card-body">
                      <Link
                        to={`/video/${item.video._id}`}
                        style={{ textDecoration: "none", color: "black" }}
                      >
                        <h5 className="card-title">{item.video.title}</h5>
                      </Link>
                      <p className="card-text text-muted">
                        {item.video.views} views · Watched{" "}
                        {timeAgo(item.watchedAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
