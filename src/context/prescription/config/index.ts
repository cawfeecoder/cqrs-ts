import { OutboxConfig, RepositoryConfig } from "@common/config";
import { z } from "zod";

export const PrescriptionConfig = z.object({
	repository: RepositoryConfig,
	inboundAdapters: z.array(z.enum(["rest", "graphql"])),
	outbox: OutboxConfig,
});

export type PrescriptionConfigType = z.infer<typeof PrescriptionConfig>;
