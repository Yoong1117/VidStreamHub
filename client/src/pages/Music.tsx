import Navbar from "../components/Navbar";
import VideoGridCategory from "../components/VideoGridCategory";

export default function MusicPage() {
  const category = "music";
  return (
    <>
      <Navbar />
      <VideoGridCategory category={category} />
    </>
  );
}
