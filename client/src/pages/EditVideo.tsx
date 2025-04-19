import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditVideo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [video, setVideo] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null); // New state for the thumbnail
  const [preview, setPreview] = useState<string | null>(null); // Preview of the thumbnail

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await axios.get(
          `http://localhost:3001/api/video/${id}/details`
        );
        const videoData = response.data;

        setVideo(videoData);
        setTitle(videoData?.title || "");
        setPrivacy(videoData?.privacy || "public");
        setCategory(videoData?.category || "");
        setDescription(videoData?.description || "");
        setPreview(videoData?.thumbnailUrl || ""); // Set current thumbnail as preview
      } catch (error) {
        console.error("Error fetching video:", error);
      }
    };

    fetchVideo();
  }, [id]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      setThumbnail(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string); // Set the preview image
      };
      reader.readAsDataURL(file); // Read the file as a data URL
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedVideo = { title, privacy, category, description };

      let thumbnailUrl = video.thumbnailUrl; // Retain current thumbnail if not updated

      if (thumbnail) {
        const formData = new FormData();
        formData.append("file", thumbnail);
        formData.append("oldThumbnailUrl", video.thumbnailUrl || "");

        const uploadResponse = await axios.post(
          "http://localhost:3001/api/video/upload-thumbnail",
          formData
        );

        thumbnailUrl = uploadResponse.data.thumbnailUrl; // Get the new thumbnail URL
      }

      await axios.put(
        `http://localhost:3001/api/video/update-thumbnail/${id}`,
        {
          ...updatedVideo,
          thumbnailUrl,
        }
      );
      alert("Video details updated successfully!");
      navigate(`/myvideos`);
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Failed to update video details.");
    }
  };

  return (
    <div className="container mt-4">
      <h2>Edit Video</h2>
      {video ? (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            {/* Thumbnail Preview */}
            {preview && (
              <div className="d-flex flex-column justify-content-center align-items-center mb-3">
                <label className="text-center">Thumbnail Preview</label>
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    width: "450px",
                    height: "300px",
                    borderRadius: "8px",
                    objectFit: "cover",
                  }}
                  className="border border-3 border-primary"
                />
              </div>
            )}

            {/* Thumbnail Upload */}
            <div className="mb-3">
              <label htmlFor="thumbnail" className="form-label">
                Thumbnail
              </label>
              <input
                type="file"
                id="thumbnail"
                className="form-control"
                accept="image/*"
                onChange={handleThumbnailChange}
              />
            </div>

            <label htmlFor="title" className="form-label">
              Title
            </label>
            <input
              type="text"
              id="title"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="privacy" className="form-label">
              Privacy
            </label>
            <select
              id="privacy"
              className="form-control"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="mb-3">
            <label>Category:</label>
            <select
              className="form-control mb-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="gaming">Gaming</option>
              <option value="music">Music</option>
              <option value="news">News</option>
              <option value="sports">Sports</option>
              <option value="others">Others</option>
            </select>
          </div>

          <div className="mb-3">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default EditVideo;
