import type { NotificationType } from "@prisma/client";
import { prisma } from "./prisma";

interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  ticketId?: string;
}

export async function createNotification(input: CreateNotificationInput) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        link: input.link,
        ticketId: input.ticketId,
      },
    });
  } catch (err) {
    console.error("[notification] failed to create:", err);
  }
}

export async function createNotificationsForUsers(
  userIds: string[],
  base: Omit<CreateNotificationInput, "userId">
) {
  if (userIds.length === 0) return;
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: base.type,
        title: base.title,
        body: base.body,
        link: base.link,
        ticketId: base.ticketId,
      })),
    });
  } catch (err) {
    console.error("[notification] failed to create batch:", err);
  }
}
