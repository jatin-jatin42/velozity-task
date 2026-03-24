import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { createTask, getTaskById, listTasksByProject, updateTask, updateTaskStatus } from "../services/task-service.js";

export const listProjectTasksController = async (request: Request, response: Response) => {
  const tasks = await listTasksByProject(
    request.authUser!,
    String(request.params.projectId),
    request.query as never
  );
  return response.json(success(tasks));
};

export const createTaskController = async (request: Request, response: Response) => {
  const task = await createTask(request.authUser!, String(request.params.projectId), request.body);
  return response.status(201).json(success(task));
};

export const getTaskController = async (request: Request, response: Response) => {
  const task = await getTaskById(request.authUser!, String(request.params.taskId));
  return response.json(success(task));
};

export const updateTaskController = async (request: Request, response: Response) => {
  const task = await updateTask(request.authUser!, String(request.params.taskId), request.body);
  return response.json(success(task));
};

export const updateTaskStatusController = async (request: Request, response: Response) => {
  const task = await updateTaskStatus(
    request.authUser!,
    String(request.params.taskId),
    request.body.status
  );
  return response.json(success(task));
};
