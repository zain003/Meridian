import { prisma } from "@/lib/prisma";
import {
  createNotificationSchema,
  type CreateNotificationInput,
} from "@/lib/validations/notification";
import {
  sendTransactionalEmail,
  renderNotificationEmailHtml,
} from "@/lib/email/resend";

export type { CreateNotificationInput };

/**
 * Creates an in-app notification record and conditionally dispatches a transactional email.
 * Includes self-notification suppression and resilient non-blocking email dispatch.
 */
export async function createNotification(
  input: CreateNotificationInput,
  actorId?: string
): Promise<{ notificationId: string }> {
  const parsed = createNotificationSchema.parse(input);

  // 1. Edge Case: Suppress self-notifications (e.g. assigning self to task or commenting on own task)
  if (actorId && actorId === parsed.userId) {
    return { notificationId: "" };
  }

  // 2. Persist in-app notification record
  const notification = await prisma.notification.create({
    data: {
      workspaceId: parsed.workspaceId,
      userId: parsed.userId,
      title: parsed.title,
      message: parsed.message,
      entityType: parsed.entityType,
      entityId: parsed.entityId,
      isRead: false,
    },
    select: {
      id: true,
      workspaceId: true,
      userId: true,
      title: true,
      message: true,
    },
  });

  // 3. Optional Transactional Email Dispatch (Non-blocking)
  if (parsed.sendEmail) {
    try {
      const recipient = await prisma.user.findUnique({
        where: { id: parsed.userId },
        select: { email: true, name: true },
      });

      if (!recipient?.email) {
        console.warn(
          `[Notification Service] User '${parsed.userId}' has no valid email address; skipping transactional email.`
        );
      } else {
        const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
        let actionUrl: string | undefined;

        if (parsed.entityType === "TASK" || parsed.entityType === "COMMENT") {
          actionUrl = `${appUrl}/${parsed.workspaceId}`;
        } else if (parsed.entityType === "RULE") {
          actionUrl = `${appUrl}/${parsed.workspaceId}/automation`;
        }

        const emailHtml = renderNotificationEmailHtml({
          title: parsed.title,
          message: parsed.message,
          userName: recipient.name || undefined,
          actionUrl,
          actionText: "Open Meridian",
        });

        // Fire non-blocking email
        sendTransactionalEmail(recipient.email, parsed.title, emailHtml).catch(
          (err) => {
            console.error(
              `[Notification Service] Failed to send email to ${recipient.email}:`,
              err
            );
          }
        );
      }
    } catch (err) {
      console.error(
        "[Notification Service] Error during transactional email lookup/dispatch:",
        err
      );
    }
  }

  return { notificationId: notification.id };
}
