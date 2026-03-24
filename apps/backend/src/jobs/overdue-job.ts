import { ActivityType, TaskStatus } from "@prisma/client";
import cron from "node-cron";
import { prisma } from "../config/prisma.js";
import { emitActivityEvent } from "../services/activity-service.js";
import { serializeActivity } from "../services/presenters.js";

const incompleteStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW];

export const startOverdueJob = () => {
  cron.schedule("*/5 * * * *", async () => {
    const tasks = await prisma.task.findMany({
      where: {
        isOverdue: false,
        status: {
          in: incompleteStatuses
        },
        dueDate: {
          lt: new Date()
        }
      },
      include: {
        project: true
      }
    });

    for (const task of tasks) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          isOverdue: true
        }
      });

      const activity = await prisma.activityLog.create({
        data: {
          projectId: task.projectId,
          taskId: task.id,
          actorId: task.createdById,
          type: ActivityType.TASK_OVERDUE,
          message: `${task.title} became overdue.`
        },
        include: {
          actor: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          task: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      emitActivityEvent({
        activity: serializeActivity(activity),
        projectId: task.projectId,
        managerId: task.project.createdByPmId,
        developerId: task.assignedDeveloperId
      });
    }
  });
};
