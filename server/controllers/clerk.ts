import { Request, Response } from "express";
import { prisma } from "../configs/prisma.js";
import { verifyWebhook } from "@clerk/express/webhooks";

export const clerkWebhook = async (req: Request, res: Response) => {
try {
const evt: any = await verifyWebhook(req);


// Getting Data from request
const { data, type } = evt;
console.log("[Clerk webhook] Event received:", type);

const clerkUserId = data?.id;
const email = data?.email_addresses?.[0]?.email_address ?? "";
const firstName = data?.first_name ?? "";
const lastName = data?.last_name ?? "";
const fullName = `${firstName} ${lastName}`.trim() || "Unknown User";
const imageUrl = data?.image_url ?? "";

// Switch Cases for different Events
switch (type) {

  case "user.created": {
    await prisma.user.upsert({
      where: { id: clerkUserId },
      update: {
        email,
        name: fullName,
        image: imageUrl,
      },
      create: {
        id: clerkUserId,
        email,
        name: fullName,
        image: imageUrl,
      },
    });
    break;
  }

  case "user.updated": {
    await prisma.user.upsert({
      where: { id: clerkUserId },
      update: {
        email,
        name: fullName,
        image: imageUrl,
      },
      create: {
        id: clerkUserId,
        email,
        name: fullName,
        image: imageUrl,
      },
    });
    break;
  }

  case "user.deleted": {
    if (!clerkUserId) {
      return res.status(400).json({ message: "Missing user id in delete event" });
    }

    await prisma.user.delete({
      where: { id: clerkUserId },
    });
    break;
  }

  case "paymentAttempt.updated": {
    if (
      (data.charge_type === "recurring" ||
        data.charge_type === "checkout") &&
      data.status === "paid"
    ) {

      const credits = { pro: 80, premium: 240 };

      const clerkUserId = data?.payer?.user_id;

      const planId: keyof typeof credits =
        data?.subscription_items?.[0]?.plan?.slug;

      if (planId !== "pro" && planId !== "premium") {
        return res.status(400).json({ message: "Invalid plan" });
      }

      console.log(planId);

      await prisma.user.update({
        where: { id: clerkUserId },
        data: {
          credits: {
            increment: credits[planId],
          },
        },
      });
    }

    break;
  }

  default:
    break;
}

res.json({ message: "Webhook Received : " + type });


} catch (error: any) {
console.error("[Clerk webhook] Error:", error?.message || error);
res.status(400).json({ message: error?.message || "Webhook verification failed" });
}
};

export default clerkWebhook
