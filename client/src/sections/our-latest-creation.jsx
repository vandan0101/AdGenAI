import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import SectionTitle from "../components/section-title";

export default function OurLatestCreation() {
    const [isHovered, setIsHovered] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [className, setClassName] = useState("");

    const sectionData = [
    {
        title: "AI Ad Creator",
        description: "Generate high-converting ad creatives in seconds using the power of artificial intelligence and smart prompts.",
        image: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=800&h=400&auto=format&fit=crop",
        align: "object-center",
    },
    {
        title: "Creative Visual Builder",
        description: "Design stunning ad visuals with automated layouts, typography, and brand-focused aesthetics.",
        image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=800&h=400&auto=format&fit=crop",
        align: "object-center",
    },
    {
        title: "Smart Campaign Generator",
        description: "Transform your ideas into complete ad campaigns optimized for engagement, reach, and performance.",
        image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=800&h=400&auto=format&fit=crop",
        align: "object-center",
    },
];


    useEffect(() => {
        if (isHovered) return;
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % sectionData.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [isHovered, sectionData.length]);

    return (
        <section className="flex flex-col items-center" id="creations">
            <SectionTitle
                title="Recent Campaign Highlights"
                description="A collection of our newest ad campaigns built with strategy, creativity, and impact."
            />

            <div className="flex items-center gap-4 h-100 w-full max-w-5xl mt-18 mx-auto" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} >
                {sectionData.map((data, index) => (
                    <motion.div key={data.title} className={`relative group flex-grow h-[400px] rounded-xl overflow-hidden ${isHovered && className ? "hover:w-full w-56" : index === activeIndex ? "w-full" : "w-56"} ${className} ${!className ? "pointer-events-none" : ""}`}
                        initial={{ y: 150, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        onAnimationComplete={() => setClassName("transition-all duration-500")}
                        transition={{ delay: `${index * 0.15}`, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                    >
                        <img className={`h-full w-full object-cover ${data.align}`} src={data.image} alt={data.title} />
                        <div className={`absolute inset-0 flex flex-col justify-end p-10 text-white bg-black/50 transition-all duration-300 ${isHovered && className ? "opacity-0 group-hover:opacity-100" : index === activeIndex ? "opacity-100" : "opacity-0"}`}>
                            <h1 className="text-3xl font-semibold">{data.title}</h1>
                            <p className="text-sm mt-2">{data.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
