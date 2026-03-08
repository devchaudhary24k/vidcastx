import { z } from "zod";

export const InternalModel = {
  token: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
  }),
};
