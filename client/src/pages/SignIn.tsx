import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import bgVid from "../assets/VS.mp4";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://localhost:3001/api/user/login",
        {
          email,
          password,
        }
      );

      sessionStorage.setItem("token", response.data.token); // Store token
      sessionStorage.setItem("username", response.data.username); // Store username

      setError("");
      navigate("/"); // Redirect to homepage
    } catch (err: any) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Invalid credentials.");
      } else {
        setError("Network error. Please try again.");
      }
    }
  };

  return (
    <div className="vh-100 d-flex justify-content-center align-items-center bg-light">
      <div
        className="container p-0 shadow-lg"
        style={{ maxWidth: "1000px", height: "600px" }}
      >
        <div className="row g-0 h-100">
          <div className="col-md-6 p-5 d-flex align-items-center bg-white">
            <div style={{ width: "100%" }}>
              <h4 className="text-center mb-4">Sign In</h4>
              {error && <p className="text-danger text-center">{error}</p>}{" "}
              <form onSubmit={handleSubmit}>
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

                <div className="d-flex justify-content-between mt-4">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                  >
                    ← Back
                  </button>

                  <button type="submit" className="btn btn-primary">
                    Login
                  </button>
                </div>
              </form>
              <div className="text-center mt-4 fs-6">
                <p>
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-decoration-none">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </div>
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
