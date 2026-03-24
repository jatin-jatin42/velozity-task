import type { Request, Response } from "express";
import { success } from "../http/response.js";
import { createClient, listClients } from "../services/client-service.js";

export const listClientsController = async (request: Request, response: Response) => {
  const clients = await listClients(request.authUser!);
  return response.json(success(clients));
};

export const createClientController = async (request: Request, response: Response) => {
  const client = await createClient(request.authUser!, request.body);
  return response.status(201).json(success(client));
};
