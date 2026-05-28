import { Request, Response } from "express";
import "dotenv/config";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import cloudinary from "../configs/cloudinary.js";

import sharp from "sharp";

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
  return `Create a high quality ecommerce advertisement image for ${productName}. ${productDescription}. ${userPrompt || ""}`.trim();
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
  const titleSize = Math.max(34, Math.floor(width * 0.045));
  const subtitleSize = Math.max(18, Math.floor(width * 0.022));

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(6,10,20,0.05)" />
          <stop offset="100%" stop-color="rgba(6,10,20,0.85)" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)" />
      <rect x="48" y="48" rx="32" ry="32" width="${Math.floor(width * 0.34)}" height="${Math.floor(height * 0.18)}" fill="rgba(10,14,24,0.55)" />
      <text x="84" y="${Math.floor(height * 0.82)}" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="${titleSize}" font-weight="700">${escapeXml(title)}</text>
      <text x="84" y="${Math.floor(height * 0.86)}" fill="rgba(255,255,255,0.84)" font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="400">${escapeXml(subtitle)}</text>
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
    .modulate({ brightness: 0.82, saturation: 1.05 })
    .blur(0.5)
    .toBuffer();

  const insetWidth = Math.floor(width * 0.34);
  const insetHeight = Math.floor(height * 0.28);
  const insetImage = await sharp(secondaryImagePath)
    .resize(insetWidth, insetHeight, { fit: "cover" })
    .png()
    .toBuffer();

  const insetShadow = Buffer.from(`
    <svg width="${insetWidth + 40}" height="${insetHeight + 40}" viewBox="0 0 ${insetWidth + 40} ${insetHeight + 40}" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="${insetWidth}" height="${insetHeight}" rx="28" ry="28" fill="rgba(0,0,0,0.34)" />
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
      { input: insetShadow, left: Math.floor(width * 0.56), top: Math.floor(height * 0.12) },
      { input: insetImage, left: Math.floor(width * 0.56) + 20, top: Math.floor(height * 0.12) + 20 },
      { input: overlay, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();

  return cloudinary.uploader.upload(`data:image/png;base64,${composed.toString("base64")}`, {
    resource_type: "image",
  });
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

    try {
      const title = productName || "Generated Ad";
      const subtitle = [productDescription, userPrompt]
        .filter(Boolean)
        .join(" • ") || "Built from your uploaded images";

      uploadResult = await generateCompositeImage({
        imagePaths: images.map((item: any) => item.path),
        aspectRatio,
        title,
        subtitle,
      });
    } catch (generationError) {
      console.warn("Composite image generation failed, using uploaded image fallback:", (generationError as any)?.message || generationError);

      uploadResult = {
        secure_url: uploadedImages[0],
      };
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