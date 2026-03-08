import { motion } from "framer-motion";

export default function Footer() {
    return (
        <motion.footer className="px-6 md:px-16 lg:px-24 xl:px-32 w-full text-sm text-slate-400 mt-40"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
        >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-14">
                <div className="sm:col-span-2 lg:col-span-1">
                    <a href="https://prebuiltui.com?utm_source=agentix">
                        <img className="h-9 w-auto" src="/assets/logo.svg" width={138} height={36} alt="logo" />
                    </a>
                    <p className="text-sm/7 mt-6">AdsGen turns your ideas into stunning ad creatives using AI — no design skills, no delays, just results.</p>
                </div>
                <div className="flex flex-col lg:items-center lg:justify-center">
                    <div className="flex flex-col text-sm space-y-2.5">
                        <h2 className="font-semibold mb-5 text-white">Quick Links</h2>
                        <a className="hover:text-slate-500 transition" href="#">Home</a>
                        <a className="hover:text-slate-500 transition" href="#">Features</a>
                        <a className="hover:text-slate-500 transition" href="#">Pricing</a>
                        <a className="hover:text-slate-500 transition" href="#">Contact</a>
                    </div>
                </div>
                {/* <div>
                    <h2 className="font-semibold text-white mb-5">Subscribe to our newsletter</h2>
                    <div className="text-sm space-y-6 max-w-sm">
                        <p>The latest news, articles, and resources, sent to your inbox weekly.</p>
                        <div className="flex items-center justify-center gap-2 p-2 rounded-md bg-slate-900">
                            <input className="outline-none w-full max-w-64 py-2 rounded px-2" type="email" placeholder="Enter your email" />
                            <button className="bg-indigo-600 px-4 py-2 text-white rounded">Subscribe</button>
                        </div>
                    </div>
                </div> */}
            </div>
            <p className="py-4 text-center border-t mt-6 border-slate-700">
                © 2026Greatstack.All Right Reserved<a href="https://prebuiltui.com?utm_source=agentix"></a> 
            </p>
        </motion.footer>
    );
};