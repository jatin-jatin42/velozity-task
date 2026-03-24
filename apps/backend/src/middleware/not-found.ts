import type { Request, Response } from "express";

export const notFoundHandler = (_request: Request, response: Response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "The requested resource was not found."
    }
  });
};
