import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { createProject, getProjectById, listProjects, updateProject } from "../services/project-service.js";

export const listProjectsController = async (request: Request, response: Response) => {
  const projects = await listProjects(request.authUser!);
  return response.json(success(projects));
};

export const createProjectController = async (request: Request, response: Response) => {
  const project = await createProject(request.authUser!, request.body);
  return response.status(201).json(success(project));
};

export const getProjectController = async (request: Request, response: Response) => {
  const project = await getProjectById(request.authUser!, String(request.params.projectId));
  return response.json(success(project));
};

export const updateProjectController = async (request: Request, response: Response) => {
  const project = await updateProject(request.authUser!, String(request.params.projectId), request.body);
  return response.json(success(project));
};
