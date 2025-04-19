import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { API_URL } from "../config";

export default function ProfilePage() {
  const [image, setImage] = useState<File | null>(null); // To store the selected image
  const [preview, setPreview] = useState<string | null>(null); // To show preview (string or null)
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState<string>(""); // To store and edit username
  const navigate = useNavigate();

  const storedUsername = sessionStorage.getItem("username"); // Retrieve the stored username

  useEffect(() => {
    if (storedUsername) {
      setUsername(storedUsername); // Set the username as the initial value
    }
  }, [storedUsername]);

  // Handle image change (selecting a file)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null; // Make sure to check for null
    if (file) {
      setImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string); // Set the preview image
      };
      reader.readAsDataURL(file); // Read the file as a data URL
    }
  };

  // Handle form submission to upload the image and update username
  const handleSubmit = async () => {
    if (!image && !username) {
      setMessage("Please select an image or change your username.");
      return;
    }

    setLoading(true);
    const formData = new FormData();

    // Only append the file if a new image is selected
    if (image) {
      formData.append("file", image);
    }

    // Get token from session storage
    const token = sessionStorage.getItem("token");

    try {
      // Update profile picture if a new image is selected
      if (image) {
        const response = await axios.put(
          `${API_URL}/api/user/profile-pic`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          // Assuming the backend responds with the updated username and profile picture URL
          alert("Profile picture updated successfully!");
        } else {
          setMessage("Error uploading image.");
          return;
        }
      }

      // Update username only if it's different from the current one
      if (username && username !== storedUsername) {
        const response = await axios.put(
          `${API_URL}/api/user/username`, // API endpoint to update username
          { username },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 200) {
          // Update the username in session storage if it's successful
          sessionStorage.setItem("username", username); // Update with the new username
          alert("Username updated successfully!");
        } else {
          setMessage("Error updating username.");
          return;
        }
      }

      navigate("/"); // Navigate back to home or profile page after successful update
    } catch (err) {
      setMessage("Error updating profile.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container py-5 border rounded shadow-lg"
      style={{ maxWidth: "600px" }}
    >
      <div className="row justify-content-center">
        <div className="col-md-12">
          <h1 className="mb-4 text-center">Edit Profile</h1>

          {/* Centered Preview Image */}
          {preview && (
            <div className="d-flex justify-content-center mb-3">
              <img
                src={preview}
                alt="Preview"
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
                className="border border-3 border-primary"
              />
            </div>
          )}

          <div className="mb-3">
            <input
              type="file"
              onChange={handleImageChange}
              className="form-control form-control-sm"
            />
          </div>

          {/* Edit Username */}
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              placeholder="Type here..."
              value={username}
              onChange={(e) => setUsername(e.target.value)} // Update the username state
              className="form-control"
            />
          </div>

          {message && <p className="text-danger mb-3">{message}</p>}

          <button
            className="btn btn-primary w-100"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <span
                className="spinner-border spinner-border-sm"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
