import SectionTitle from "../components/section-title";
import { motion } from "framer-motion";

export default function AboutOurApps() {
    const sectionData = [
        {
            title: "Instant Ad Generation",
            description: "Create ready-to-use ad creatives in seconds from a simple prompt — no design skills required.",
            image: "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=200&h=200&auto=format&fit=crop",
            className: "py-10 border-b border-slate-700 md:py-0 md:border-r md:border-b-0 md:px-10"
        },
        {
            title: "Smart Creative Designs",
            description: "AI-crafted layouts, typography, and visuals that match your brand and marketing goals.",
            image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=200&h=200&auto=format&fit=crop",
            className: "py-10 border-b border-slate-700 md:py-0 lg:border-r md:border-b-0 md:px-10"
        },
        {
            title: "One-Click Campaign Ready",
            description: "Download, share, and launch ads instantly across social media and marketing platforms.",
            image: "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=200&h=200&auto=format&fit=crop",
            className: "py-10 border-b border-slate-700 md:py-0 md:border-b-0 md:px-10"
        },
    ];
    return (
        <section className="flex flex-col items-center" id="about">
            <SectionTitle title="About our apps" description="A visual collection of our most recent works - each piece crafted with intention, emotion, and style." />
            <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-8 md:px-0 mt-18">
                {sectionData.map((data, index) => (
                    <motion.div key={data.title} className={data.className}
                        initial={{ y: 150, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: `${index * 0.15}`, type: "spring", stiffness: 320, damping: 70, mass: 1 }}
                    >
                        <div className="size-10 p-2 bg-indigo-600/20 border border-indigo-600/30 rounded">
                            <img src={data.image} alt="" />
                        </div>
                        <div className="mt-5 space-y-2">
                            <h3 className="text-base font-medium text-slate-200">{data.title}</h3>
                            <p className="text-sm text-slate-400">{data.description}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}