import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Loader2Icon,
  EllipsisIcon,
  ImageIcon,
  Share2Icon,
  Trash2Icon
} from "lucide-react";

const ProjectCard = ({ gen, setGenerations, forCommunity = false }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // delete project
  const handleDelete = (id) => {
    const confirm = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirm) return;

    setGenerations((prev) => prev.filter((item) => item.id !== id));
  };

  // publish toggle
  const togglePublish = (projectId) => {
    setGenerations((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? { ...item, isPublished: !item.isPublished }
          : item
      )
    );
  };

  return (
    <div key={gen.id} className="mb-4 break-inside-avoid">
      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition group">

        {/* preview */}
        <div
          className={`${
            gen?.aspectRatio === "9:16" ? "aspect-[9/16]" : "aspect-video"
          } relative overflow-hidden`}
        >
          {gen.generatedImage && (
            <img
              src={gen.generatedImage}
              alt={gen.productName}
              className={`absolute inset-0 w-full h-full object-cover transition duration-500 ${
                gen.generatedVideo
                  ? "group-hover:opacity-0"
                  : "group-hover:scale-105"
              }`}
            />
          )}

          {gen.generatedVideo && (
            <video
              src={gen.generatedVideo}
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition duration-500"
              onMouseEnter={(e) => e.currentTarget.play()}
              onMouseLeave={(e) => e.currentTarget.pause()}
            />
          )}

          {/* loading */}
          {!gen.generatedImage && !gen.generatedVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <Loader2Icon className="size-7 animate-spin" />
            </div>
          )}

          {/* status badges */}
          <div className="absolute left-3 top-3 flex gap-2 items-center">
            {gen.isGenerating && (
              <span className="text-xs bg-yellow-500 px-2 py-1 rounded">
                Generating
              </span>
            )}

            {gen.isPublished && (
              <span className="text-xs bg-green-500 px-2 py-1 rounded">
                Published
              </span>
            )}
          </div>

          {/* action menu (my generations only) */}
          {!forCommunity && (
            <div className="absolute right-3 top-3">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="bg-black/30 rounded-full p-2"
              >
                <EllipsisIcon size={18} />
              </button>

              {menuOpen && (
                <ul className="absolute right-0 mt-2 w-40 bg-black/80 backdrop-blur rounded-lg text-sm border border-white/10">

                  {gen.generatedImage && (
                    <a
                      href={gen.generatedImage}
                      download
                      className="flex gap-2 items-center px-4 py-2 hover:bg-white/10"
                    >
                      <ImageIcon size={14} /> Download Image
                    </a>
                  )}

                  {(gen.generatedImage || gen.generatedVideo) && (
                    <button
                      onClick={() =>
                        navigator.share({
                          url: gen.generatedVideo || gen.generatedImage,
                          title: gen.productName,
                          text: gen.productDescription
                        })
                      }
                      className="w-full flex gap-2 items-center px-4 py-2 hover:bg-white/10"
                    >
                      <Share2Icon size={14} /> Share
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(gen.id)}
                    className="w-full flex gap-2 items-center px-4 py-2 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2Icon size={14} /> Delete
                  </button>
                </ul>
              )}
            </div>
          )}

          {/* source images */}
          <div className="absolute right-3 bottom-3">
            <img
              src={gen.uploadedImages?.[0]}
              alt="product"
              className="w-16 h-16 object-cover rounded-full animate-float"
            />
            <img
              src={gen.uploadedImages?.[1]}
              alt="model"
              className="w-16 h-16 object-cover rounded-full animate-float -ml-8"
            />
          </div>
        </div>

        {/* details */}
        <div className="p-4">
          <h3 className="font-medium text-lg mb-1">{gen.productName}</h3>

          <p className="text-sm text-gray-400">
            Created: {new Date(gen.createdAt).toLocaleString()}
          </p>

          {gen.updatedAt && (
            <p className="text-xs text-gray-500 mt-1">
              Updated: {new Date(gen.updatedAt).toLocaleString()}
            </p>
          )}

          {/* description */}
          {gen.productDescription && (
            <div className="mt-3 text-sm text-gray-300">
              {gen.productDescription}
            </div>
          )}

          {/* prompt */}
          {gen.userPrompt && (
            <div className="mt-3 text-xs text-gray-300">
              {gen.userPrompt}
            </div>
          )}

          {/* buttons */}
          {!forCommunity && (
            <div className="mt-4 grid grid-cols-2 gap-3">

              <button
                className="text-xs border border-white/20 rounded-md py-2 hover:bg-white/10"
                onClick={() => {
                  navigate(`/result/${gen.id}`);
                  scrollTo(0, 0);
                }}
              >
                View Details
              </button>

              <button
                onClick={() => togglePublish(gen.id)}
                className="text-xs bg-indigo-500 hover:bg-indigo-600 rounded-md py-2"
              >
                {gen.isPublished ? "Unpublish" : "Publish"}
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;