import { prisma } from "./prisma";

/**
 * Return the ticket if the user can access it (creator, assignee, or group member).
 */
export async function getAccessibleTicket(userId: string, ticketId: string) {
  return prisma.ticket.findFirst({
    where: {
      id: ticketId,
      OR: [
        { createdById: userId },
        { assignedToId: userId },
        { scope: "GROUP", group: { members: { some: { userId } } } },
      ],
    },
  });
}
