import { Request, Response } from "express";
import * as Sentry from "@sentry/node";
import { prisma } from "../configs/prisma.js";
import cloudinary from "../configs/cloudinary.js";

// CREATE PROJECT
export const createProject = async (req: Request, res: Response) => {
  const { userId } = req.auth();
  let isCreditDeducted = false;

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
    if (images.length < 2 || !productName) {
      return res
        .status(400)
        .json({ message: "Please upload at least 2 images" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.credits < 5) {
      return res
        .status(401)
        .json({ message: "Insufficient credits" });
    } else {
      // deduct credits
      await prisma.user
        .update({
          where: { id: userId },
          data: { credits: { decrement: 5 } },
        })
        .then(() => {
          isCreditDeducted = true;
        });
    }

    // upload images
    let uploadedImages = await Promise.all(
      images.map(async (item: any) => {
        let result = await cloudinary.uploader.upload(item.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

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

    res.json({ project });
  } catch (error: any) {
    Sentry.captureException(error);

    // rollback credits if failed
    if (isCreditDeducted) {
      await prisma.user.update({
        where: { id: userId },
        data: { credits: { increment: 5 } },
      });
    }

    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROJECT VIDEO
export const createVideo = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const { projectId, generatedVideo, generatedImage, isGenerating, error } =
      req.body;

    if (!projectId) {
      return res.status(400).json({ message: "projectId is required" });
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        generatedVideo: generatedVideo ?? project.generatedVideo,
        generatedImage: generatedImage ?? project.generatedImage,
        isGenerating:
          typeof isGenerating === "boolean" ? isGenerating : false,
        error: error ?? "",
      },
    });

    res.json({ project: updatedProject });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

// GET ALL PUBLISHED PROJECTS
export const getAllPublishedProjects = async (
  req: Request,
  res: Response
) => {
  try {
    const projects = await prisma.project.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({ projects });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};

// DELETE PROJECT
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { userId } = req.auth();
    const projectId = Array.isArray(req.params.projectId)
      ? req.params.projectId[0]
      : req.params.projectId;

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({ message: "Project deleted" });
  } catch (error: any) {
    Sentry.captureException(error);
    res.status(500).json({ message: error.message });
  }
};
