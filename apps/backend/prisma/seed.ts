import bcrypt from "bcryptjs";
import {
  ActivityType,
  NotificationType,
  PrismaClient,
  TaskPriority,
  TaskStatus,
  UserRole
} from "@prisma/client";

const prisma = new PrismaClient();

const passwordHash = await bcrypt.hash("password123", 10);

const daysFromNow = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

async function main() {
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.feedCursor.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();

  const [admin, pmOne, pmTwo, devOne, devTwo, devThree, devFour] = await Promise.all([
    prisma.user.create({
      data: {
        name: "Aarav Admin",
        email: "admin@velozity.dev",
        passwordHash,
        role: UserRole.ADMIN
      }
    }),
    prisma.user.create({
      data: {
        name: "Priya PM",
        email: "pm1@velozity.dev",
        passwordHash,
        role: UserRole.PROJECT_MANAGER
      }
    }),
    prisma.user.create({
      data: {
        name: "Karan PM",
        email: "pm2@velozity.dev",
        passwordHash,
        role: UserRole.PROJECT_MANAGER
      }
    }),
    prisma.user.create({
      data: {
        name: "Ravi Dev",
        email: "dev1@velozity.dev",
        passwordHash,
        role: UserRole.DEVELOPER
      }
    }),
    prisma.user.create({
      data: {
        name: "Neha Dev",
        email: "dev2@velozity.dev",
        passwordHash,
        role: UserRole.DEVELOPER
      }
    }),
    prisma.user.create({
      data: {
        name: "Ishaan Dev",
        email: "dev3@velozity.dev",
        passwordHash,
        role: UserRole.DEVELOPER
      }
    }),
    prisma.user.create({
      data: {
        name: "Maya Dev",
        email: "dev4@velozity.dev",
        passwordHash,
        role: UserRole.DEVELOPER
      }
    })
  ]);

  const [clientOne, clientTwo, clientThree] = await Promise.all([
    prisma.client.create({
      data: {
        name: "Northstar Health",
        email: "hello@northstar.test",
        company: "Northstar Health",
        phone: "+1 111 222 3333"
      }
    }),
    prisma.client.create({
      data: {
        name: "Canvas Commerce",
        email: "ops@canvas.test",
        company: "Canvas Commerce",
        phone: "+1 444 555 6666"
      }
    }),
    prisma.client.create({
      data: {
        name: "Orbit Labs",
        email: "team@orbit.test",
        company: "Orbit Labs",
        phone: "+1 777 888 9999"
      }
    })
  ]);

  const [projectOne, projectTwo, projectThree] = await Promise.all([
    prisma.project.create({
      data: {
        name: "Patient Portal Refresh",
        description: "Improve visibility, security, and task flow for the healthcare portal.",
        clientId: clientOne.id,
        createdByPmId: pmOne.id
      }
    }),
    prisma.project.create({
      data: {
        name: "Checkout Conversion Sprint",
        description: "Reduce cart abandonment and tighten QA handoff around releases.",
        clientId: clientTwo.id,
        createdByPmId: pmOne.id
      }
    }),
    prisma.project.create({
      data: {
        name: "Research Dashboard",
        description: "Internal metrics dashboard with live reporting for product experiments.",
        clientId: clientThree.id,
        createdByPmId: pmTwo.id
      }
    })
  ]);

  const taskDefinitions = [
    {
      project: projectOne,
      creatorId: pmOne.id,
      assignedDeveloperId: devOne.id,
      title: "Implement secure session audit panel",
      description: "Build the audit overview for recent security-sensitive actions.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(-2)
    },
    {
      project: projectOne,
      creatorId: pmOne.id,
      assignedDeveloperId: devTwo.id,
      title: "Refine appointment summary cards",
      description: "Improve clarity of the appointment details and edge-state messaging.",
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(1)
    },
    {
      project: projectOne,
      creatorId: pmOne.id,
      assignedDeveloperId: devThree.id,
      title: "Add accessibility pass for patient forms",
      description: "Resolve keyboard traps and improve field validation hints.",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(3)
    },
    {
      project: projectOne,
      creatorId: pmOne.id,
      assignedDeveloperId: devFour.id,
      title: "Ship notification preference center",
      description: "Let patients control email and SMS reminders.",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(-4)
    },
    {
      project: projectOne,
      creatorId: pmOne.id,
      assignedDeveloperId: devOne.id,
      title: "Profile image upload hardening",
      description: "Add validation and friendly failure states to uploads.",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(6)
    },
    {
      project: projectTwo,
      creatorId: pmOne.id,
      assignedDeveloperId: devTwo.id,
      title: "Instrument checkout funnel events",
      description: "Capture the drop-off points with attribution metadata.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(2)
    },
    {
      project: projectTwo,
      creatorId: pmOne.id,
      assignedDeveloperId: devThree.id,
      title: "Refactor coupon validation service",
      description: "Reduce invalid coupon edge-case failures before payment submit.",
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(-1)
    },
    {
      project: projectTwo,
      creatorId: pmOne.id,
      assignedDeveloperId: devFour.id,
      title: "Update cart summary layout",
      description: "Improve clarity of pricing and shipping totals.",
      status: TaskStatus.DONE,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(-3)
    },
    {
      project: projectTwo,
      creatorId: pmOne.id,
      assignedDeveloperId: devOne.id,
      title: "Add fallback for payment retries",
      description: "Improve resiliency when gateway requests partially fail.",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(5)
    },
    {
      project: projectTwo,
      creatorId: pmOne.id,
      assignedDeveloperId: devTwo.id,
      title: "Fix order summary rounding bug",
      description: "Match displayed tax math with the order confirmation service.",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(4)
    },
    {
      project: projectThree,
      creatorId: pmTwo.id,
      assignedDeveloperId: devThree.id,
      title: "Prototype live metric tiles",
      description: "Build the first iteration of experiment KPI cards.",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.CRITICAL,
      dueDate: daysFromNow(2)
    },
    {
      project: projectThree,
      creatorId: pmTwo.id,
      assignedDeveloperId: devFour.id,
      title: "Create cohort trend comparison chart",
      description: "Compare baseline and experiment arms over time.",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(7)
    },
    {
      project: projectThree,
      creatorId: pmTwo.id,
      assignedDeveloperId: devOne.id,
      title: "Improve filter state persistence",
      description: "Keep chart filters stable between reloads and shared links.",
      status: TaskStatus.IN_REVIEW,
      priority: TaskPriority.MEDIUM,
      dueDate: daysFromNow(1)
    },
    {
      project: projectThree,
      creatorId: pmTwo.id,
      assignedDeveloperId: devTwo.id,
      title: "Export data snapshot CSV",
      description: "Allow analysts to export filtered views for offline review.",
      status: TaskStatus.DONE,
      priority: TaskPriority.LOW,
      dueDate: daysFromNow(-5)
    },
    {
      project: projectThree,
      creatorId: pmTwo.id,
      assignedDeveloperId: devThree.id,
      title: "Harden dashboard permission checks",
      description: "Ensure experiment reports respect team ownership constraints.",
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: daysFromNow(8)
    }
  ];

  const tasks = [];

  for (const definition of taskDefinitions) {
    const task = await prisma.task.create({
      data: {
        projectId: definition.project.id,
        title: definition.title,
        description: definition.description,
        assignedDeveloperId: definition.assignedDeveloperId,
        status: definition.status,
        priority: definition.priority,
        dueDate: definition.dueDate,
        isOverdue:
          definition.dueDate < new Date() &&
          definition.status !== TaskStatus.DONE,
        createdById: definition.creatorId
      }
    });

    tasks.push(task);

    await prisma.activityLog.create({
      data: {
        projectId: definition.project.id,
        taskId: task.id,
        actorId: definition.creatorId,
        type: ActivityType.TASK_CREATED,
        message: `${definition.project.name}: ${definition.title} was created.`
      }
    });

    if (definition.status !== TaskStatus.TODO) {
      await prisma.activityLog.create({
        data: {
          projectId: definition.project.id,
          taskId: task.id,
          actorId: definition.assignedDeveloperId,
          type: ActivityType.TASK_STATUS_CHANGED,
          fromValue: TaskStatus.TODO,
          toValue: definition.status,
          message: `${definition.title} moved from TODO to ${definition.status}.`
        }
      });
    }

    await prisma.notification.create({
      data: {
        userId: definition.assignedDeveloperId,
        type: NotificationType.TASK_ASSIGNED,
        title: "Seeded assignment",
        body: `You were assigned to ${definition.title}.`,
        relatedTaskId: task.id
      }
    });
  }

  const reviewReadyTask = tasks.find((task) => task.status === TaskStatus.IN_REVIEW);

  if (reviewReadyTask) {
    await prisma.notification.create({
      data: {
        userId: pmOne.id,
        type: NotificationType.TASK_IN_REVIEW,
        title: "Task ready for review",
        body: `${reviewReadyTask.title} has moved to review.`,
        relatedTaskId: reviewReadyTask.id
      }
    });
  }

  await prisma.activityLog.createMany({
    data: [
      {
        projectId: projectOne.id,
        actorId: pmOne.id,
        type: ActivityType.PROJECT_CREATED,
        message: `${projectOne.name} was created for ${clientOne.name}.`
      },
      {
        projectId: projectTwo.id,
        actorId: pmOne.id,
        type: ActivityType.PROJECT_CREATED,
        message: `${projectTwo.name} was created for ${clientTwo.name}.`
      },
      {
        projectId: projectThree.id,
        actorId: pmTwo.id,
        type: ActivityType.PROJECT_CREATED,
        message: `${projectThree.name} was created for ${clientThree.name}.`
      },
      {
        projectId: projectOne.id,
        taskId: tasks[0].id,
        actorId: pmOne.id,
        type: ActivityType.TASK_OVERDUE,
        message: `${tasks[0].title} is overdue and needs attention.`
      },
      {
        projectId: projectTwo.id,
        taskId: tasks[6].id,
        actorId: pmOne.id,
        type: ActivityType.TASK_OVERDUE,
        message: `${tasks[6].title} is overdue and needs attention.`
      }
    ]
  });

  console.log("Seed complete");
  console.table([
    { role: admin.role, email: admin.email, password: "password123" },
    { role: pmOne.role, email: pmOne.email, password: "password123" },
    { role: pmTwo.role, email: pmTwo.email, password: "password123" },
    { role: devOne.role, email: devOne.email, password: "password123" },
    { role: devTwo.role, email: devTwo.email, password: "password123" },
    { role: devThree.role, email: devThree.email, password: "password123" },
    { role: devFour.role, email: devFour.email, password: "password123" }
  ]);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
