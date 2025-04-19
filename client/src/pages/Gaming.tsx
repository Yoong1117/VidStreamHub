import Navbar from "../components/Navbar";
import VideoGridCategory from "../components/VideoGridCategory";

export default function GamingPage() {
  const category = "gaming";
  return (
    <>
      <Navbar />
      <VideoGridCategory category={category} />
    </>
  );
}
