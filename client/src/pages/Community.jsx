import { useEffect, useState } from "react";
import { dummyGenerations } from "../assets/assets.jsx";
import ProjectCard from "../components/ProjectCard";

const Community = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setTimeout(() => {
      setProjects(dummyGenerations);
      setLoading(false);
    }, 3000);
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return (
    <div className="min-h-screen px-6 md:px-16 lg:px-24 xl:px-32 py-10">

      {/* header */}
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-semibold mb-4">
          Community
        </h1>

        <p className="text-gray-400">
          See what others are creating with UGC.ai
        </p>
      </header>

      {/* loading */}
      {loading && (
        <p className="text-gray-400">Loading projects...</p>
      )}

      {/* projects list */}
      {!loading && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              gen={project}
              forCommunity={true}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Community;