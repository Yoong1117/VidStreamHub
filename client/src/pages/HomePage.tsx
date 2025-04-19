import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import axios from "axios";
import VideoGrid from "../components/VideoGrid";
import { API_URL } from "../config";
import "../css/HomePage.css";

export default function HomePage() {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/video/data`);
        setVideos(res.data);
      } catch (err) {
        console.error("Failed to fetch videos:", err);
      }
    };
    fetchVideos();
  }, []);

  return (
    <>
      <Navbar />
      <VideoGrid videos={videos} source="homepage" />
    </>
  );
}
