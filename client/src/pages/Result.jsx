import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2Icon, RefreshCwIcon, VideoIcon, ImageIcon, SparklesIcon } from "lucide-react";
import { dummyGenerations } from "../assets/assets";

const Result = () => {

  const [project, setProjectData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchProjectData = async () => {
    setTimeout(() => {
      setProjectData(dummyGenerations[0]);
      setLoading(false);
    }, 3000);
  };

  const handleGenerateVideo = async () => {
    setIsGenerating(true);

    setTimeout(() => {
      setProjectData((prev) => ({
        ...prev,
        generatedVideo: "/assets/generatedVideo1.mp4"
      }));
      setIsGenerating(false);
    }, 3000);
  };

  useEffect(() => {
    fetchProjectData();
  }, []);

  return loading ? (
    <div className="h-screen w-full flex items-center justify-center">
      <Loader2Icon className="animate-spin text-indigo-500 size-9" />
    </div>
  ) : (
    <div className="min-h-screen text-white p-6 md:p-12 mt-20">

      <div className="max-w-6xl mx-auto">

        {/* header */}
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-3xl font-medium">
            Generation Result
          </h1>

          <Link
            to="/generate"
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <RefreshCwIcon className="w-4 h-4" />
            <p className="max-sm:hidden">New Generation</p>
          </Link>
        </header>

        {/* grid */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* main result */}
          <div className="lg:col-span-2 space-y-6">

            <div className="glass-panel inline-block p-2 rounded-2xl">

              <div
                className={`${
                  project?.aspectRatio === "9:16"
                    ? "aspect-[9/16]"
                    : "aspect-video"
                } sm:max-h-[500px] rounded-xl bg-gray-900 overflow-hidden relative`}
              >

                {project?.generatedVideo ? (
                  <video
                    src={project.generatedVideo}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={project.generatedImage}
                    alt="Generated Result"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            </div>

          </div>

          {/* sidebar */}
          <div className="space-y-6">

            {/* download buttons */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">Actions</h3>

              <div className="flex flex-col gap-3">

                <a href={project.generatedImage} download>
                  <button
                    disabled={!project.generatedImage}
                    className="w-full border border-white/20 rounded-md py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <ImageIcon className="size-4" />
                    Download Image
                  </button>
                </a>

                <a href={project.generatedVideo} download>
                  <button
                    disabled={!project.generatedVideo}
                    className="w-full border border-white/20 rounded-md py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <VideoIcon className="size-4" />
                    Download Video
                  </button>
                </a>

              </div>
            </div>

            {/* generate video */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">

              <div className="absolute top-0 right-0 p-4 opacity-10">
                <VideoIcon className="size-24" />
              </div>

              <h3 className="text-xl font-semibold mb-2">
                Video Magic
              </h3>

              <p className="text-gray-400 text-sm mb-6">
                Turn this static image into a dynamic video for social media.
              </p>

              {!project.generatedVideo ? (
                <button
                  onClick={handleGenerateVideo}
                  disabled={isGenerating}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-md py-3 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <>Generating Video...</>
                  ) : (
                    <>
                      <SparklesIcon className="size-4" />
                      Generate Video
                    </>
                  )}
                </button>
              ) : (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-center text-sm font-medium">
                  Video Generated Successfully!
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Result;