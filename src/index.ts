import { PrescriptionService } from "@prescription/application/service/prescription";
import { RESTPrescriptionAdapter } from "@prescription/infrastructure/adapters/primary/rest";
import { RESTPrescription } from "@prescription/infrastructure/dtos/rest/prescription";
import { SqliteConnector } from "@prescription/infrastructure/adapters/secondary/sqlite";
import { ApplicationLogger } from "@common/utils/logger";
import { NATSBus } from "@common/infrastructure/adapters/secondary/eventbus/nats";
import {
	PrescriptionAggregate,
	PrescriptionAggregateEventEnvlopeType,
} from "@prescription/domain/entity/aggregate";
import { PrescriptionCloudEvent } from "@prescription/infrastructure/dtos/eventbus/prescription";
import { GraphQLPrescriptionAdapter } from "@prescription/infrastructure/adapters/primary/graphql";
import { GraphQLPrescription } from "@prescription/infrastructure/dtos/graphql";
import config from "config";
import {
	PrescriptionConfig,
	PrescriptionConfigType,
} from "@prescription/config";
import { FileConfigProvider } from "@common/config/file";
import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import { AggregateSnapshot } from "@common/domain/entity";
import { EventBus } from "@common/application/ports/outbound/eventBus";
import { PrescriptionOutboxAdapter } from "@prescription/infrastructure/adapters/primary/outbox";

(async () => {
	const logger = ApplicationLogger.getInstance()
		.enableJSON()
		.enableConsoleOutput()
		.getLogger();
	try {
		let config = FileConfigProvider.getInstance();
		const configProvider = await config.get<PrescriptionConfigType>([
			"prescription",
		]);
		if (configProvider.isErr()) {
			logger.error(configProvider.unwrapErr().message);
		}
		const prescriptionConfig = PrescriptionConfig.parse(
			configProvider.unwrap(),
		);
		let repository: EventRepository<
			PrescriptionAggregateEventEnvlopeType,
			PrescriptionAggregateEventEnvlopeType,
			AggregateSnapshot<PrescriptionAggregate>,
			AggregateSnapshot<PrescriptionAggregate>
		>;
		switch (prescriptionConfig.repository.type) {
			case "sqlite": {
				repository = new SqliteConnector({
					filename: prescriptionConfig.repository.connectionString,
					migrationPath: "./migrations/sqlite",
				});
				await repository.migrate();
				break;
			}
		}
		for (const adapterType of prescriptionConfig.inboundAdapters) {
			if (adapterType === "rest") {
				let service = new PrescriptionService<RESTPrescription>({}, repository);
				let inboundAdapter = new RESTPrescriptionAdapter(service);
				await inboundAdapter.run(exports);
			}
			if (adapterType === "graphql") {
				let service = new PrescriptionService<GraphQLPrescription>(
					{},
					repository,
				);
				let inboundAdapter = new GraphQLPrescriptionAdapter(service);
				await inboundAdapter.run(exports);
			}
		}
		if (prescriptionConfig.outbox.enabled) {
			let bus:
				| EventBus<
						PrescriptionAggregateEventEnvlopeType,
						PrescriptionAggregateEventEnvlopeType
				  >
				| undefined;
			if (prescriptionConfig.outbox.configuration.type === "nats") {
				bus = new NATSBus<PrescriptionAggregateEventEnvlopeType>({
					address:
						prescriptionConfig.outbox.configuration.configuration.address,
				});
			}

			if (bus) {
				logger.info("Outbox background task started", {
					type: prescriptionConfig.outbox.configuration.type,
					transportType: prescriptionConfig.outbox.transportType,
				});
				let outboxAdapter = new PrescriptionOutboxAdapter(bus, repository);
				let outboxRoutine: Function;
				if (prescriptionConfig.outbox.transportType === "cloudevent") {
					const mapper = (event: PrescriptionAggregateEventEnvlopeType) =>
						PrescriptionCloudEvent.from(event);
					outboxRoutine = () =>
						outboxAdapter.run<PrescriptionCloudEvent>(mapper);
				}

				setInterval(async () => outboxRoutine(), 10000);
			}
		}
	} catch (err) {
		logger.error((err as Error).message, {
			stack: (err as Error).stack,
		});
		return process.exit(1);
	}
})();
