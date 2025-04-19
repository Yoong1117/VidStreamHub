import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import bgVid from "../assets/VS.mp4";
import "../css/SignUp.css";
import axios from "axios";

export default function SignUp() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    axios
      .post("http://localhost:3001/api/user/register", {
        username,
        email,
        password,
      })
      .then((result) => {
        console.log(result);
        navigate("/signin");
      })
      .catch((err) => {
        if (err.response && err.response.status === 400) {
          alert(err.response.data.message);
        } else {
          console.log(err);
        }
      });
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div
        className="container p-0 shadow-lg"
        style={{ maxWidth: "1000px", height: "600px" }}
      >
        <div className="row g-0 h-100">
          {/* Left Side - Sign-Up Form */}
          <div className="col-md-6 p-5 d-flex align-items-center bg-white">
            <div style={{ width: "100%" }}>
              <h4 className="text-center mb-4">Sign Up</h4>

              <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="mb-3">
                  <label className="form-label fs-6">Username</label>
                  <input
                    type="username"
                    className="form-control"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>

                {/* Email Input */}
                <div className="mb-3">
                  <label className="form-label fs-6">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="mb-3">
                  <label className="form-label fs-6">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Buttons */}
                <div className="d-flex justify-content-between mt-4">
                  <button
                    onClick={() => navigate(-1)}
                    type="button"
                    className="btn btn-secondary"
                    style={{ fontSize: "14px", padding: "10px 20px" }}
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: "14px", padding: "10px 20px" }}
                  >
                    Sign Up
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side - Video */}
          <div className="col-md-6">
            <video autoPlay loop muted className="w-100 h-100 object-fit-cover">
              <source src={bgVid} type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </div>
  );
}
