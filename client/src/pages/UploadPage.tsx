import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../css/UploadPage.css";
import { API_URL } from "../config";

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("gaming");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const username = sessionStorage.getItem("username");
  const navigate = useNavigate();

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
  }, [previewUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = [
      "video/mp4",
      "video/avi",
      "video/mov",
      "video/mkv",
      "video/webm",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Only video files are allowed!");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setThumbnailFile(null); // Clear old thumbnail
    setThumbnailPreview(null);
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed for thumbnails.");
      return;
    }
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleCaptureThumbnail = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        // Set the canvas size to match the video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current frame of the video to the canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert canvas content to image URL
        const thumbnailUrl = canvas.toDataURL("image/jpeg");

        // Set the preview and the thumbnail file
        setThumbnailPreview(thumbnailUrl);

        // Convert the data URL to a file and set it
        fetch(thumbnailUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], "thumbnail.jpg", {
              type: "image/jpeg",
            });
            setThumbnailFile(file);
          });
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile || !title) {
      alert("Please select a video and fill in title.");
      return;
    }
    if (!thumbnailFile) {
      alert("Please upload or capture a thumbnail.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("video", selectedFile);
    formData.append("thumbnail", thumbnailFile);
    formData.append("username", username || "");
    formData.append("title", title);
    formData.append("privacy", privacy);
    formData.append("description", description);
    formData.append("category", category);

    try {
      const response = await axios.post(
        `${API_URL}/api/video/upload-video`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: () => {
            // Remove progress handling as we no longer need it
          },
        }
      );

      if (response.status === 201) {
        alert("Video & thumbnail uploaded successfully!");
        navigate("/");
      } else {
        alert("Failed to upload video.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during upload.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow p-4">
        <h2 className="mb-4 text-center">Upload Video</h2>
        <label>Choose a video to upload</label>
        <input
          type="file"
          accept="video/*"
          className="form-control mb-3"
          onChange={handleFileChange}
          disabled={isSubmitting}
        />

        {previewUrl && (
          <>
            <div className="mb-3 text-center">
              <h5>Video Preview:</h5>
              <video width="600" controls ref={videoRef}>
                <source src={previewUrl} />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="mb-3 text-center">
              <button
                className="btn btn-primary"
                onClick={handleCaptureThumbnail}
                disabled={isSubmitting}
              >
                Capture Thumbnail
              </button>
            </div>

            <div className="mb-3">
              <label>Or Upload Thumbnail:</label>
              <input
                type="file"
                accept="image/*"
                className="form-control"
                onChange={handleThumbnailUpload}
                disabled={isSubmitting}
              />
            </div>

            {thumbnailPreview && (
              <div className="mb-3 text-center">
                <h6>Thumbnail Preview:</h6>
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail"
                  style={{ maxWidth: "300px" }}
                />
              </div>
            )}

            <label>Title:</label>
            <input
              type="text"
              className="form-control mb-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />

            <label>Privacy:</label>
            <select
              className="form-control mb-2"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>

            <label>Category:</label>
            <select
              className="form-control mb-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="news">News</option>
              <option value="sports">Sports</option>
              <option value="others">Others</option>
            </select>

            <label>Description:</label>
            <textarea
              className="form-control mb-3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              rows={8}
            />

            <div className="d-flex justify-content-between mt-3">
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/")}
                disabled={isSubmitting}
              >
                Back
              </button>

              <button
                className="btn btn-success"
                onClick={handleSubmit}
                disabled={!selectedFile || isSubmitting}
              >
                {isSubmitting ? "Uploading..." : "Submit Video"}
              </button>
            </div>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}
