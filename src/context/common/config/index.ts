import { Result } from "@sniptt/monads/build";
import { z } from "zod";

export const RepositoryConfig = z.object({
  type: z.enum(["sqlite"]),
  connectionString: z.string(),
});

export const OutboxConfig = z.object({
  enabled: z.boolean(),
  transportType: z.enum(["cloudevent"]),
  configuration: z.discriminatedUnion("type", [
    z.object({
      type: z.literal("nats"),
      configuration: z.object({
        address: z.string(),
      }),
    }),
    z.object({
      type: z.literal("unknown"),
    }),
  ]),
});

export type RepositoryConfigType = z.infer<typeof RepositoryConfig>;

export interface ConfigProvider {
  get<Q>(key: string[]): Promise<Result<Q, Error>>;
}
