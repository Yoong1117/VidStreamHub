// React and third-party libraries
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

// Bootstrap CSS and JS
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// CSS
import "../css/Navbar.css";

// Import assets
import logo from "../assets/logo_only.png";
import search from "../assets/search.png";
import home from "../assets/home.png";
import clip from "../assets/clip.png";
import game from "../assets/game.png";
import music from "../assets/music.png";
import news from "../assets/news.png";
import sports from "../assets/sport.png";
import setting from "../assets/setting.png";
import help from "../assets/help.png";
import feedback from "../assets/feedback.png";
import about from "../assets/about.png";
import video from "../assets/video.png";
import history from "../assets/history.png";
import playlist from "../assets/playlist.png";
import download from "../assets/download.png";
import edit from "../assets/edit.png";
import logout from "../assets/logout.png";

export default function UserNavbar() {
  const [token, setToken] = useState<string | null>(null);
  const [userProfilePic, setUserProfilePic] = useState<string | null>(null);
  const isLoggedIn = !!token;
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = sessionStorage.getItem("token");
    const storedUsername = sessionStorage.getItem("username");
    setToken(storedToken);

    if (storedUsername) {
      fetch(`http://localhost:3001/api/user/profile/username/${storedUsername}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.profilePic) {
            setUserProfilePic(data.profilePic);
            sessionStorage.setItem("profilePic", data.profilePic); // Optional caching
          }
        })
        .catch((err) => console.error("Error fetching profile pic:", err));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("username");
    sessionStorage.removeItem("profilePic");
    setToken(null);
    setUserProfilePic(null);
    window.location.reload();
    navigate("/");
  };

  // Determine which profile picture to display
  const profilePicUrl = userProfilePic
    ? userProfilePic
    : "https://res.cloudinary.com/dzrl3jo6x/image/upload/profile_dxzkob"; // Default image

  return (
    <nav className="navbar custom-navbar">
      <div className="container-fluid d-flex align-items-center">
        {/* Dropdown menu */}
        <div className="btn-group dropdown">
          <Link to="/">
            <button type="button" className="btn">
              <img src={logo} alt="Logo" width="30" height="30" />
            </button>
          </Link>
          <button
            type="button"
            className="btn dropdown-toggle dropdown-toggle-split"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <span className="visually-hidden">Toggle Dropdown</span>
          </button>
          <ul className="dropdown-menu text-bg-light">
            <li>
              <Link to="/" className="dropdown-item">
                <img src={home} alt="Home" className="icon home" />
                Home
              </Link>
            </li>

            {isLoggedIn && (
              <>
                <li>
                  <Link
                    to={`/profilepage/${sessionStorage.getItem("username")}`}
                    className="dropdown-item"
                  >
                    <img src={clip} alt="Clip" className="icon clip" />
                    My profile
                  </Link>
                </li>

                <li>
                  <hr className="dropdown-divider" />
                </li>

                <li>
                  <Link to="/history" className="dropdown-item">
                    <img src={history} alt="History" className="icon clip" />
                    History
                  </Link>
                </li>

                <li>
                  <Link to="/" className="dropdown-item">
                    <img
                      src={playlist}
                      alt="Playlist"
                      className="icon playlist"
                    />
                    Playlist
                  </Link>
                </li>

                <li>
                  <Link to="/" className="dropdown-item">
                    <img
                      src={download}
                      alt="Download"
                      className="icon download"
                    />
                    Download
                  </Link>
                </li>
              </>
            )}

            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <Link to="/gaming" className="dropdown-item">
                <img src={game} alt="Game" className="icon game" />
                Gaming
              </Link>
            </li>
            <li>
              <Link to="/music" className="dropdown-item">
                <img src={music} alt="Music" className="icon music" />
                Music
              </Link>
            </li>
            <li>
              <Link to="/news" className="dropdown-item">
                <img src={news} alt="News" className="icon news" />
                News
              </Link>
            </li>
            <li>
              <Link to="/sports" className="dropdown-item">
                <img src={sports} alt="Sports" className="icon sports" />
                Sports
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <a className="dropdown-item" href="#">
                <img src={setting} alt="Setting" className="icon setting" />
                Setting
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                <img src={help} alt="Help" className="icon help" />
                Help
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                <img src={feedback} alt="Feedback" className="icon feedback" />
                Feedback
              </a>
            </li>
            <li>
              <a className="dropdown-item" href="#">
                <img src={about} alt="About" className="icon about" />
                About
              </a>
            </li>
          </ul>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-grow-1 d-flex justify-content-center">
          <form className="d-flex search-form" role="search">
            <input
              className="form-control me-2"
              type="search"
              placeholder="Search ..."
              aria-label="Search"
            />
            <button className="btn" type="submit">
              <img src={search} alt="Search" width="25" height="25" />
            </button>
          </form>
        </div>

        {/* Right: Profile Pic Dropdown */}
        {isLoggedIn ? (
          <>
            <Link to="/uploadpage">
              <button className="btn btn-primary btn-upload me-3">
                <img src={video} alt="Video" className="video" />
                <label className="upload-label">Upload</label>
              </button>
            </Link>

            {/* Profile picture dropdown */}
            <div className="btn-group dropdown">
              <button
                className="btn dropdown-toggle"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{
                  backgroundImage: `url(${profilePicUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%", // Circle mask
                }}
              ></button>
              <ul className="dropdown-menu dropdown-menu-end text-bg-light">
                <li>
                  <Link to="/edit-profile" className="dropdown-item">
                    <img src={edit} alt="Edit" className="icon edit" />
                    Edit Profile
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <img src={logout} alt="Logout" className="icon logout" />
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          </>
        ) : (
          <Link to="/signin">
            <button className="btn btn-primary btn-signin">Sign In</button>
          </Link>
        )}
      </div>
    </nav>
  );
}
