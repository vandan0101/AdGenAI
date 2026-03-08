import { useState } from "react";
import { ArrowRight, RectangleVertical, RectangleHorizontal } from "lucide-react";
import UploadZone from "../components/UploadZone";
import Title from "../components/title";

export default function Generator() {
    const [name, setName] = useState("");
    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [aspectRatio, setAspectRatio] = useState("9:16");
    const [productImage, setProductImage] = useState(null);
    const [modelImage, setModelImage] = useState(null);
    const [userPrompt, setUserPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFileChange = (file, type) => {
        if (!file) return;
        if (type === "product") setProductImage(file);
        else setModelImage(file);
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 800);
    };

    const inputClassName = "w-full bg-white/3 rounded-lg border-2 p-4 text-sm border-violet-200/10 focus:border-violet-500/50 outline-none transition-all";

    return (
        <div className="min-h-screen text-white p-6 md:p-12 mt-28">
            <form onSubmit={handleGenerate} className="max-w-4xl mx-auto mb-40">
                <Title
                    heading="Create In-Context Image"
                    description="Upload your model and product images to generate stunning UGC, short-form videos and social media posts"
                />

                <div className="flex gap-20 max-sm:flex-col items-start justify-between">
                    <div className="flex flex-col w-full sm:max-w-60 gap-8 mt-8 mb-12">
                        <UploadZone
                            label="Product Image"
                            file={productImage}
                            onClear={() => setProductImage(null)}
                            onChange={(e) => handleFileChange(e, "product")}
                        />

                        <UploadZone
                            label="Model Image"
                            file={modelImage}
                            onClear={() => setModelImage(null)}
                            onChange={(e) => handleFileChange(e, "model")}
                        />
                    </div>

                    <div className="w-full">
                        <div className="mb-4">
                            <label htmlFor="name" className="block text-sm mb-4">
                                Project Name
                            </label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Name your project"
                                required
                                className={inputClassName}
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="productName" className="block text-sm mb-4">
                                Product Name
                            </label>
                            <input
                                type="text"
                                id="productName"
                                value={productName}
                                onChange={(e) => setProductName(e.target.value)}
                                placeholder="Enter the name of the product"
                                required
                                className={inputClassName}
                            />
                        </div>

                        <div className="mb-4 text-gray-300">
                            <label htmlFor="productDescription" className="block text-sm mb-4">
                                Product Description <span className="text-xs text-violet-400">(optional)</span>
                            </label>
                            <textarea
                                id="productDescription"
                                rows={4}
                                value={productDescription}
                                onChange={(e) => setProductDescription(e.target.value)}
                                placeholder="Enter the description of the product"
                                className={`${inputClassName} resize-none`}
                            />
                        </div>

                        <div className="mb-4 text-gray-300">
                            <label className="block text-sm mb-4">Aspect Ratio</label>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setAspectRatio("9:16")}
                                    className={`p-2.5 h-12 w-12 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer ${
                                        aspectRatio === "9:16" ? "ring-violet-500/50 bg-white/10" : ""
                                    }`}
                                >
                                    <RectangleVertical className="h-6 w-6 text-white" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAspectRatio("16:9")}
                                    className={`p-2.5 h-12 w-12 bg-white/6 rounded transition-all ring-2 ring-transparent cursor-pointer ${
                                        aspectRatio === "16:9" ? "ring-violet-500/50 bg-white/10" : ""
                                    }`}
                                >
                                    <RectangleHorizontal className="h-6 w-6 text-white" />
                                </button>
                            </div>
                        </div>

                        <div className="mb-4 text-gray-300">
                            <label htmlFor="userPrompt" className="block text-sm mb-4">
                                User Prompt <span className="text-xs text-violet-400">(optional)</span>
                            </label>
                            <textarea
                                id="userPrompt"
                                rows={4}
                                value={userPrompt}
                                onChange={(e) => setUserPrompt(e.target.value)}
                                placeholder="Describe how you want the narration to be."
                                className={`${inputClassName} resize-none`}
                            />
                        </div>

                        <button
                            type="submit"
                            className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition text-white px-6 py-3 rounded-md"
                            disabled={isGenerating}
                        >
                            <ArrowRight className="h-5 w-5" />
                            {isGenerating ? "Generating..." : "Generate Image"}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
