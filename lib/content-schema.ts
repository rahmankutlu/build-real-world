import { z } from "zod";
import { difficulties } from "./types";

export const projectMetadataSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3).max(80),
  summary: z.string().min(40).max(180),
  difficulty: z.enum(difficulties),
  primaryDb: z.string().min(3),
  realtime: z.boolean(), queue: z.boolean(), payments: z.boolean(), multiTenancy: z.boolean(), eventDriven: z.boolean(),
  topics: z.array(z.string().min(2)).min(3), actors: z.array(z.string().min(2)).min(3), featured: z.boolean(),
});
