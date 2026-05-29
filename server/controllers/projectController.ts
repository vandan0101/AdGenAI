import { Request, Response } from "express";
import "dotenv/config";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import cloudinary from "../configs/cloudinary.js";

import sharp from "sharp";
import axios from "axios";

const MOCK_VIDEO_URL =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const MOCK_IMAGE_DELAY_MS = 5000;
const MOCK_IMAGE_URL = "https://placehold.co/800x1200/png?text=Mock+Generated+Image";

const getImageDimensions = (aspectRatio?: string) => {
  switch (aspectRatio) {
    case "16:9":
      return { width: 1920, height: 1080 };
    case "1:1":
      return { width: 1024, height: 1024 };
    case "9:16":
    default:
      return { width: 1080, height: 1920 };
  }
};

const buildPrompt = ({
  productName,
  productDescription,
  userPrompt,
}: {
  productName: string;
  productDescription: string;
  userPrompt?: string;
}) => {
  return [
    `Create a professional high-end social media advertisement image for ${productName}.`,
    productDescription ? `Product details: ${productDescription}.` : "",
    userPrompt ? `Creative direction: ${userPrompt}.` : "",
    "Use a fresh composition, distinct lighting, a polished studio look, and a visually compelling ad layout.",
    "Do not reuse the input image structure or make a collage of the uploaded images.",
    "Focus on a new marketing creative that looks like a generated campaign asset.",
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

const buildNegativePrompt = () =>
  [
    "collage",
    "split layout",
    "same image structure",
    "duplicate scene",
    "low quality",
    "blurry",
    "text artifacts",
    "watermark",
    "logo",
  ].join(", ");

const DEFAULT_HUGGINGFACE_MODELS = [
  "stabilityai/stable-diffusion-xl-base-1.0",
  "black-forest-labs/FLUX.1-schnell",
];

const isHuggingFaceFallbackAllowed = () =>
  process.env.HUGGINGFACE_ALLOW_FALLBACK === "true";

const getHuggingFaceErrorMessage = (error: unknown) => {
  const status = (error as any)?.response?.status;
  const responseData = (error as any)?.response?.data;

  let responseText = "";
  if (Buffer.isBuffer(responseData)) {
    responseText = responseData.toString("utf-8");
  } else if (typeof responseData === "string") {
    responseText = responseData;
  } else if (responseData) {
    responseText = JSON.stringify(responseData);
  }

  if (status === 401) {
    return "Hugging Face rejected the API token. Update HUGGINGFACE_API_TOKEN with a valid token, make sure it has Inference Providers permission, then restart the server.";
  }

  if (status === 403) {
    return "Hugging Face denied access to the selected model. Check that your HF token has Inference Providers permission and that the model is available for hf-inference.";
  }

  if (responseText) {
    return `Hugging Face request failed: ${responseText}`;
  }

  return (error as any)?.message || "Hugging Face request failed.";
};

const shouldTryNextHuggingFaceModel = (error: unknown) => {
  const status = (error as any)?.response?.status;
  const responseData = (error as any)?.response?.data;

  let responseText = "";
  if (Buffer.isBuffer(responseData)) {
    responseText = responseData.toString("utf-8");
  } else if (typeof responseData === "string") {
    responseText = responseData;
  } else if (responseData) {
    responseText = JSON.stringify(responseData);
  }

  const normalizedResponseText = responseText.toLowerCase();

  return (
    status === 403 ||
    normalizedResponseText.includes("model not supported by provider") ||
    normalizedResponseText.includes("not supported by provider hf-inference")
  );
};

const getHuggingFaceModelCandidates = () => {
  const configuredModels = process.env.HUGGINGFACE_MODEL?.split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return [
    ...(configuredModels || []),
    ...DEFAULT_HUGGINGFACE_MODELS,
  ].filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);
};

const createCompositeFallback = async ({
  images,
  aspectRatio,
  productName,
  productDescription,
  userPrompt,
}: {
  images: any[];
  aspectRatio?: string;
  productName: string;
  productDescription: string;
  userPrompt?: string;
}) => {
  const title = productName || "Generated Ad";
  const subtitle = [productDescription, userPrompt].filter(Boolean).join(" • ") || "Built from your uploaded images";

  return generateCompositeImage({
    imagePaths: images.map((item: any) => item.path),
    aspectRatio,
    title,
    subtitle,
  });
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const createTextOverlay = ({
  width,
  height,
  title,
  subtitle,
}: {
  width: number;
  height: number;
  title: string;
  subtitle: string;
}) => {
  const titleSize = Math.max(36, Math.floor(width * 0.05));
  const subtitleSize = Math.max(18, Math.floor(width * 0.021));
  const badgeSize = Math.max(16, Math.floor(width * 0.016));

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(6,10,20,0.08)" />
          <stop offset="65%" stop-color="rgba(6,10,20,0.12)" />
          <stop offset="100%" stop-color="rgba(6,10,20,0.92)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)" />
      <rect x="64" y="${Math.floor(height * 0.74)}" rx="28" ry="28" width="${Math.floor(width * 0.52)}" height="${Math.floor(height * 0.19)}" fill="rgba(6,10,20,0.54)" stroke="rgba(255,255,255,0.12)" />
      <rect x="84" y="${Math.floor(height * 0.77)}" rx="999" ry="999" width="${Math.floor(width * 0.18)}" height="42" fill="rgba(99,102,241,0.92)" />
      <text x="110" y="${Math.floor(height * 0.77) + 28}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${badgeSize}" font-weight="700">Generated Ad</text>
      <text x="84" y="${Math.floor(height * 0.87)}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="800">${escapeXml(title)}</text>
      <text x="84" y="${Math.floor(height * 0.91)}" fill="rgba(255,255,255,0.84)" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="400">${escapeXml(subtitle)}</text>
    </svg>
  `);
};

const generateCompositeImage = async ({
  imagePaths,
  aspectRatio,
  title,
  subtitle,
}: {
  imagePaths: string[];
  aspectRatio?: string;
  title: string;
  subtitle: string;
}) => {
  const { width, height } = getImageDimensions(aspectRatio);
  const mainImagePath = imagePaths[0];
  const secondaryImagePath = imagePaths[1];

  const background = await sharp(mainImagePath)
    .resize(width, height, { fit: "cover" })
    .modulate({ brightness: 0.88, saturation: 1.12 })
    .sharpen()
    .toBuffer();

  const insetWidth = Math.floor(width * 0.31);
  const insetHeight = Math.floor(height * 0.34);
  const insetImage = await sharp(secondaryImagePath)
    .resize(insetWidth, insetHeight, { fit: "cover" })
    .png()
    .toBuffer();

  const insetShadow = Buffer.from(`
    <svg width="${insetWidth + 40}" height="${insetHeight + 40}" viewBox="0 0 ${insetWidth + 40} ${insetHeight + 40}" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="${insetWidth}" height="${insetHeight}" rx="32" ry="32" fill="rgba(0,0,0,0.38)" />
    </svg>
  `);

  const overlay = createTextOverlay({
    width,
    height,
    title,
    subtitle,
  });

  const composed = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 7, g: 12, b: 24, alpha: 1 },
    },
  })
    .composite([
      { input: background, left: 0, top: 0 },
      { input: insetShadow, left: Math.floor(width * 0.58), top: Math.floor(height * 0.09) },
      { input: insetImage, left: Math.floor(width * 0.58) + 20, top: Math.floor(height * 0.09) + 20 },
      { input: overlay, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return cloudinary.uploader.upload(`data:image/png;base64,${composed.toString("base64")}`, {
    resource_type: "image",
  });
};

const generateHuggingFaceImage = async ({
  productName,
  productDescription,
  userPrompt,
  aspectRatio,
}: {
  productName: string;
  productDescription: string;
  userPrompt?: string;
  aspectRatio?: string;
}) => {
  const promptText = buildPrompt({ productName, productDescription, userPrompt });
  const { width, height } = getImageDimensions(aspectRatio);
  const hfBaseUrl = process.env.HUGGINGFACE_BASE_URL || "https://router.huggingface.co/hf-inference/models";
  const modelCandidates = getHuggingFaceModelCandidates();
  let lastError: unknown;

  for (const model of modelCandidates) {
    try {
      const hfUrl = `${hfBaseUrl}/${model}`;

      const hfResp = await axios.post(
        hfUrl,
        {
          inputs: promptText,
          parameters: {
            width,
            height,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            negative_prompt: buildNegativePrompt(),
          },
          options: {
            wait_for_model: true,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
            Accept: "image/png",
            "Content-Type": "application/json",
          },
          responseType: "arraybuffer",
          timeout: 120000,
        }
      );

      const contentType = String(hfResp.headers["content-type"] || "");
      if (!contentType.startsWith("image/")) {
        const responseText = Buffer.from(hfResp.data).toString("utf-8");
        throw new Error(`Hugging Face returned a non-image response for model ${model}: ${responseText}`);
      }

      const base64Image = Buffer.from(hfResp.data, "binary").toString("base64");

      return cloudinary.uploader.upload(`data:image/png;base64,${base64Image}`, {
        resource_type: "image",
      });
    } catch (error) {
      lastError = error;

      const status = (error as any)?.response?.status;
      console.warn("Hugging Face model attempt failed", { model, status, message: (error as any)?.message });

      if (!shouldTryNextHuggingFaceModel(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("No Hugging Face model could generate an image.");
};

// CREATE PROJECT
export const createProject = async (req: Request, res: Response) => {
  const { userId } = req.auth();

  let isCreditDeducted = false;
  let tempProjectId: string | null = null;

  const {
    name = "New Project",
    aspectRatio,
    userPrompt,
    productName,
    productDescription,
    targetLength = 5,
  } = req.body;

  const images = Array.isArray(req.files) ? req.files : [];

  try {
    // VALIDATION
    if (images.length < 2 || !productName) {
      return res.status(400).json({
        message: "Please upload at least 2 images",
      });
    }

    // CHECK USER
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 5) {
      return res.status(401).json({
        message: "Insufficient balance",
      });
    }

    // DEDUCT CREDITS
    await prisma.user
      .update({
        where: { id: userId },
        data: {
          credits: {
            decrement: 5,
          },
        },
      })
      .then(() => {
        isCreditDeducted = true;
      });

    // UPLOAD ORIGINAL IMAGES
    const uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        const result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });

        return result.secure_url;
      })
    );

    // CREATE PROJECT
    const project = await prisma.project.create({
      data: {
        name,
        userId,
        productName,
        productDescription,
        userPrompt,
        aspectRatio,
        targetLength: parseInt(targetLength),
        uploadedImages,
        isGenerating: true,
      },
    });

    tempProjectId = project.id;

    let uploadResult: { secure_url: string };
    const shouldUseHuggingFace = process.env.HUGGINGFACE_ENABLED === "true";
    const allowHuggingFaceFallback = isHuggingFaceFallbackAllowed();

    try {
      if (shouldUseHuggingFace && process.env.HUGGINGFACE_API_TOKEN) {
        console.log("Generation: attempting Hugging Face inference for project", project.id);

        try {
          uploadResult = await generateHuggingFaceImage({
            productName,
            productDescription,
            userPrompt,
            aspectRatio,
          });
          console.log("Generation: Hugging Face inference succeeded, uploaded result to Cloudinary for project", project.id);
        } catch (hfError) {
          const message = (hfError as any)?.message || String(hfError);
          const status = (hfError as any)?.response?.status;

          console.warn("Generation: Hugging Face failed", {
            projectId: project.id,
            status,
            message,
            allowFallback: allowHuggingFaceFallback,
          });

          if (!allowHuggingFaceFallback) {
            throw hfError;
          }

          console.warn("Generation: using local composite fallback after Hugging Face failure", {
            projectId: project.id,
          });

          uploadResult = await createCompositeFallback({
            images,
            aspectRatio,
            productName,
            productDescription,
            userPrompt,
          });
        }
      } else {
        console.log("Generation: using local composite for project", project.id);
        uploadResult = await createCompositeFallback({
          images,
          aspectRatio,
          productName,
          productDescription,
          userPrompt,
        });
      }
    } catch (generationError) {
      const message = (generationError as any)?.message || String(generationError);
      const status = (generationError as any)?.response?.status;
      console.warn("Generation failed for project", project.id, message);

      const userMessage = status ? getHuggingFaceErrorMessage(generationError) : message;

      await prisma.project.update({
        where: { id: project.id },
        data: {
          isGenerating: false,
          error: userMessage,
        },
      });

      return res.status(500).json({
        message: userMessage,
      });
    }

    // UPDATE PROJECT
    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        generatedImage: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    res.json({
      success: true,
      projectId: project.id,
      generatedImage: uploadResult.secure_url,
    });
  } catch (error: any) {
    Sentry.captureException(error);

    // UPDATE PROJECT ERROR
    if (tempProjectId) {
      await prisma.project.update({
        where: {
          id: tempProjectId,
        },
        data: {
          isGenerating: false,
          error: error.message,
        },
      });
    }

    // REFUND CREDITS
    if (isCreditDeducted) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          credits: {
            increment: 5,
          },
        },
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

// CREATE VIDEO
export const createVideo = async (req: Request, res: Response) => {
  const { userId } = req.auth();

  let isCreditDeducted = false;

  try {
    let { projectId } = req.body;
    if (Array.isArray(projectId)) {
      projectId = projectId[0];
    }

    // CHECK USER
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || user.credits < 10) {
      return res.status(401).json({
        message: "Insufficient balance",
      });
    }

    // DEDUCT CREDITS
    await prisma.user
      .update({
        where: {
          id: userId,
        },
        data: {
          credits: {
            decrement: 10,
          },
        },
      })
      .then(() => {
        isCreditDeducted = true;
      });

    // FIND PROJECT
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
      include: {
        user: true,
      },
    });

    if (!project || project.isGenerating) {
      return res.status(404).json({
        message: "Generation in progress",
      });
    }

    if (project.generatedVideo) {
      return res.status(404).json({
        message: "Video already generated",
      });
    }

    // UPDATE GENERATING STATUS
    await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        isGenerating: true,
      },
    });

    // MOCK VIDEO GENERATION
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // UPDATE PROJECT
    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        generatedVideo: MOCK_VIDEO_URL,
        isGenerating: false,
      },
    });

    res.json({
      message: "Mock video generation completed",
      videoUrl: MOCK_VIDEO_URL,
    });
  } catch (error: any) {
    Sentry.captureException(error);

    // REFUND CREDITS
    if (isCreditDeducted) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          credits: {
            increment: 10,
          },
        },
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

// UPDATE PROJECT
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();

    let { projectId } = req.body;
    const { generatedVideo, generatedImage, isGenerating, error } = req.body;

    if (Array.isArray(projectId)) {
      projectId = projectId[0];
    }

    if (!projectId) {
      return res.status(400).json({
        message: "projectId is required",
      });
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        generatedVideo: generatedVideo ?? project.generatedVideo,
        generatedImage: generatedImage ?? project.generatedImage,

        isGenerating:
          typeof isGenerating === "boolean"
            ? isGenerating
            : project.isGenerating,

        error: error ?? project.error,
      },
    });

    res.json({
      project: updatedProject,
    });
  } catch (error: any) {
    Sentry.captureException(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// GET ALL PUBLISHED PROJECTS
export const getAllPublishedProjects = async (
  req: Request,
  res: Response
) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        isPublished: true,
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    res.json({
      projects,
    });
  } catch (error: any) {
    Sentry.captureException(error);

    res.status(500).json({
      message: error.message,
    });
  }
};

// DELETE PROJECT
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    let { projectId } = req.params;
    if (Array.isArray(projectId)) {
      projectId = projectId[0];
    }

    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        userId,
      },
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    await prisma.project.delete({
      where: {
        id: projectId,
      },
    });

    res.json({
      message: "Project deleted successfully",
    });
  } catch (error: any) {
    Sentry.captureException(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
