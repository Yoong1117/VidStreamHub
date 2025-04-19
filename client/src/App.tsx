import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Homepage from "./pages/HomePage.tsx";
import SignIn from "./pages/SignIn.tsx";
import SignUp from "./pages/SignUp.tsx";
import Uploadpage from "./pages/UploadPage.tsx";
import ProfilePage from "./pages/ProfilePage.tsx";
import VideoDetails from "./pages/VideoDetails";
import EditVideo from "./pages/EditVideo";
import EditProfile from "./pages/EditProfile.tsx";
import History from "./pages/History.tsx";
import Gaming from "./pages/Gaming.tsx";
import Music from "./pages/Music.tsx";
import News from "./pages/News.tsx";
import Sports from "./pages/Sports.tsx";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/uploadpage" element={<Uploadpage />} />
        <Route path="/profilepage/:username" element={<ProfilePage />} />
        <Route path="/video/:id" element={<VideoDetails />} />
        <Route path="/edit-video/:id" element={<EditVideo />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/history" element={<History />} />
        <Route path="/gaming" element={<Gaming />} />
        <Route path="/music" element={<Music />} />
        <Route path="/news" element={<News />} />
        <Route path="/sports" element={<Sports />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
