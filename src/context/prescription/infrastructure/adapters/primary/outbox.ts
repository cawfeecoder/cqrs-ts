import { Option } from "@sniptt/monads/build";
import { ApplicationLogger } from "@common/utils/logger";
import { EventBus } from "@common/application/ports/outbound/eventBus";
import { AggregateSnapshot } from "@common/domain/entity";
import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import {
	PrescriptionAggregate,
	PrescriptionAggregateEventEnvlopeType,
} from "@prescription/domain/entity/aggregate";

export class PrescriptionOutboxAdapter {
	private bus: EventBus<
		PrescriptionAggregateEventEnvlopeType,
		PrescriptionAggregateEventEnvlopeType
	>;
	private repository: EventRepository<
		PrescriptionAggregateEventEnvlopeType,
		PrescriptionAggregateEventEnvlopeType,
		AggregateSnapshot<PrescriptionAggregate>,
		AggregateSnapshot<PrescriptionAggregate>
	>;
	private logger;

	public constructor(
		bus: EventBus<
			PrescriptionAggregateEventEnvlopeType,
			PrescriptionAggregateEventEnvlopeType
		>,
		repository: EventRepository<
			PrescriptionAggregateEventEnvlopeType,
			PrescriptionAggregateEventEnvlopeType,
			AggregateSnapshot<PrescriptionAggregate>,
			AggregateSnapshot<PrescriptionAggregate>
		>,
	) {
		this.bus = bus;
		this.repository = repository;
		this.logger = ApplicationLogger.getInstance().getLogger();
	}

	public async run<O>(
		mapper: (event: PrescriptionAggregateEventEnvlopeType) => Option<O>,
	) {
		const outboxEvents = await this.repository.retrieveOutboxEvents();
		outboxEvents.match({
			ok: (val) => {
				this.logger.info("Retrieved outbox events", {
					count: val.length,
				});
				if (val.length > 100) {
					this.logger.info(
						"Too many events to process this internval, processing first 100",
					);
					val = val.slice(0, 100);
				}
				(async () => {
					for (const event of val) {
						const result = await this.repository.sendAndDeleteOutboxEvent<O>(
							event,
							this.bus,
							(event) => {
								switch (event.payload.eventType()) {
									case "PrescriptionCreated":
										return "system.prescription.created";
									case "PrescriptionUpdated":
										return "system.prescription.updated";
									default:
										return "trash";
								}
							},
							mapper,
						);
						result.match({
							ok: () => {
								this.logger.info("Successfully sent event from outbox", {
									id: event.sequence,
									event: event,
									event_type: event.payload.eventType()
								});
							},
							err: (err) => {
								this.logger.error(err.message);
							},
						});
					}
				})();
			},
			err: (err) => {
				this.logger.error(err.message);
			},
		});
	}
}
