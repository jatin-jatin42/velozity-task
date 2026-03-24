import { z } from "zod";

export const createClientSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().optional().or(z.literal("")),
  company: z.string().max(120).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal(""))
});
