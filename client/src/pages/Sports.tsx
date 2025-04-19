import Navbar from "../components/Navbar";
import VideoGridCategory from "../components/VideoGridCategory";

export default function News() {
  const category = "sports";
  return (
    <>
      <Navbar />
      <VideoGridCategory category={category} />
    </>
  );
}
