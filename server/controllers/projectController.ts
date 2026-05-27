import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import cloudinary from "../configs/cloudinary.js";

import {
  GoogleGenAI,
  GenerateContentConfig,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/genai";

import fs from "fs";
import path from "path";
import axios from "axios";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

// IMAGE TO BASE64
const loadImage = (filePath: string, mimeType: string) => {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString("base64"),
      mimeType,
    },
  };
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
        message: "Insufficient credits",
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

    // ---------------- IMAGE GENERATION ----------------

    const img1Mime = images[0].mimetype || (images[0] as any).mimeType || "image/png";
    const img2Mime = images[1].mimetype || (images[1] as any).mimeType || "image/png";

    const img1base64 = loadImage(images[0].path, img1Mime);
    const img2base64 = loadImage(images[1].path, img2Mime);

    const prompt = {
      text: `
      Combine the person and product into a realistic photo.
      Make the person naturally hold or use the product.
      Match lighting, shadows, scale and perspective.
      Make professional studio quality output.
      Generate ultra realistic ecommerce image.

      Product Name:
      ${productName}

      Product Description:
      ${productDescription}

      Additional Instructions:
      ${userPrompt || ""}
      `,
    };

    const model = "gemini-2.0-flash-preview-image-generation";

    const generationConfig: GenerateContentConfig = {
      maxOutputTokens: 32768,
      temperature: 1,
      topP: 0.95,

      responseModalities: ["IMAGE"],

      imageConfig: {
        aspectRatio: aspectRatio || "9:16",
      },

      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.OFF,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.OFF,
        },
      ],
    };

    // GENERATE IMAGE
    const response: any = await ai.models.generateContent({
      model,
      contents: [img1base64, img2base64, prompt],
      config: generationConfig,
    });

    // CHECK RESPONSE
    if (!response?.candidates?.[0]?.content?.parts) {
      throw new Error("Unexpected AI response");
    }

    const parts = response.candidates[0].content.parts;

    let finalBuffer: Buffer | null = null;

    for (const part of parts) {
      if (part.inlineData) {
        finalBuffer = Buffer.from(part.inlineData.data, "base64");
      }
    }

    if (!finalBuffer) {
      throw new Error("Failed to generate image");
    }

    const base64Image = `data:image/png;base64,${finalBuffer.toString(
      "base64"
    )}`;

    // UPLOAD GENERATED IMAGE
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      resource_type: "image",
    });

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
        message: "Insufficient credits",
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

    const prompt = `
      Make the person showcase the product.

      Product Name:
      ${project.productName}

      Product Description:
      ${project.productDescription}

      Additional Instructions:
      ${project.userPrompt || ""}
    `;

    const model = "veo-2.0-generate-001";

    if (!project.generatedImage) {
      throw new Error("Generated image not found");
    }

    // DOWNLOAD IMAGE
    const image = await axios.get(project.generatedImage, {
      responseType: "arraybuffer",
    });

    const imageBytes: any = Buffer.from(image.data);

    // GENERATE VIDEO
    let operation: any = await ai.models.generateVideos({
      model,
      prompt,

      image: {
        imageBytes: imageBytes.toString("base64"),
        mimeType: "image/png",
      },

      config: {
        aspectRatio: project.aspectRatio || "9:16",
        numberOfVideos: 1,
      },
    });

    // WAIT FOR VIDEO
    while (!operation.done) {
      console.log("Waiting for video generation...");

      await new Promise((resolve) => setTimeout(resolve, 10000));

      operation = await ai.operations.getVideosOperation({
        operation,
      });
    }

    const filename = `${userId}-${Date.now()}.mp4`;
    const filePath = path.join("videos", filename);

    // CREATE VIDEO FOLDER
    fs.mkdirSync("videos", {
      recursive: true,
    });

    if (!operation.response.generatedVideos) {
      throw new Error(
        operation.response?.raiMediaFilteredReasons?.[0] ||
          "Video generation failed"
      );
    }

    // DOWNLOAD VIDEO
    await ai.files.download({
      file: operation.response.generatedVideos[0].video,
      downloadPath: filePath,
    });

    // UPLOAD VIDEO TO CLOUDINARY
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
    });

    // UPDATE PROJECT
    await prisma.project.update({
      where: {
        id: project.id,
      },
      data: {
        generatedVideo: uploadResult.secure_url,
        isGenerating: false,
      },
    });

    // DELETE LOCAL VIDEO
    fs.unlinkSync(filePath);

    res.json({
      message: "Video generation completed",
      videoUrl: uploadResult.secure_url,
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