import { Err, Ok, Option, Result } from "@sniptt/monads/build";
import { Knex, knex } from "knex";
import KnexBetterSqlite3 = require("knex/lib/dialects/better-sqlite3");
import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import { AggregateSnapshot } from "@common/domain/entity";
import {
	PrescriptionAggregate,
	PrescriptionAggregateEventEnvlope,
	PrescriptionAggregateEventEnvlopeType,
} from "@prescription/domain/entity/aggregate";
import {
	PrescriptionCreatedEvent,
	PrescriptionEvent,
} from "@prescription/domain/entity/event";
import { EventBus } from "@common/application/ports/outbound/eventBus";

const EVENT_TABLE_NAME = "events";
const SNAPSHOT_TABLE_NAME = "snapshots";
const OUTBOX_TABLE_NAME = "outbox_events";

export class SqliteConnector
	implements
		EventRepository<
			PrescriptionAggregateEventEnvlopeType,
			PrescriptionAggregateEventEnvlopeType,
			AggregateSnapshot<PrescriptionAggregate>,
			AggregateSnapshot<PrescriptionAggregate>
		>
{
	private connection;
	private instanceId;

	public constructor({
		filename,
		instanceId,
	}: {
		filename: string;
		instanceId?: string;
	}) {
		this.instanceId = instanceId;
		try {
			this.connection = knex({
				client: KnexBetterSqlite3,
				connection: {
					filename: filename,
				},
				useNullAsDefault: true,
			});
		} catch (e) {
			throw new Error(
				`Failed to constructor SQLite connector: ${(e as Error).message}`,
			);
		}
	}

	public async storeEvent(
		event: PrescriptionAggregateEventEnvlopeType,
	): Promise<Result<undefined, Error>> {
		const insert = (tx: Knex.Transaction<any, any[]>) =>
			tx.table(EVENT_TABLE_NAME).insert({
				aggregate_type: event.aggregateType,
				aggregate_id: event.aggregateId,
				sequence: event.sequence,
				event_type: event.payload.eventType(),
				event_version: event.payload.eventVersion(),
				payload: JSON.stringify(event.payload),
				metadata: JSON.stringify(event.metadata),
				timestamp: event.timestamp,
			});
		const outboxInsert = (tx: Knex.Transaction<any, any[]>) =>
			tx.table(OUTBOX_TABLE_NAME).insert({
				aggregate_type: event.aggregateType,
				aggregate_id: event.aggregateId,
				sequence: event.sequence,
				event_type: event.payload.eventType(),
				event_version: event.payload.eventVersion(),
				payload: JSON.stringify(event.payload),
				metadata: JSON.stringify(event.metadata),
				timestamp: event.timestamp,
				instance_id: this.instanceId,
			});
		let tx = await this.connection.transaction();
		try {
			await insert(tx);
		} catch (e) {
			await tx.rollback();
			return Err(e as Error);
		}
		try {
			await outboxInsert(tx);
		} catch (e) {
			await tx.rollback();
			return Err(e as Error);
		}
		await tx.commit();
		return Ok(undefined);
	}

	public async retrieveEvents(
		aggregateId: string,
		after: Option<string>,
	): Promise<Result<PrescriptionAggregateEventEnvlopeType[], Error>> {
		const fields = [
			"aggregate_type",
			"aggregate_id",
			"sequence",
			"event_type",
			"event_version",
			"payload",
			"metadata",
			"timestamp",
		];
		const query = this.connection.select(fields).from(EVENT_TABLE_NAME).where({
			aggregate_id: aggregateId,
		});
		try {
			const result = await query;
			const events: PrescriptionAggregateEventEnvlopeType[] = [];
			for (const event of result) {
				const raw_payload = JSON.parse(event["payload"]);
				switch (event["event_type"]) {
					case "PrescriptionCreated": {
						events.push(
							new PrescriptionAggregateEventEnvlope({
								aggregateId: event["aggregate_id"],
								aggregateType: event["aggregate_type"],
								sequence: event["sequence"],
								payload: new PrescriptionCreatedEvent({
									id: raw_payload["id"],
									patientId: raw_payload["patientId"],
									medicationId: raw_payload["medicationId"],
									address: raw_payload["address"],
									eventId: raw_payload["eventId"],
								}),
								metadata: event["metadata"],
								timestamp: new Date(event["timestamp"]),
							}),
						);
						break;
					}
					default:
						break;
				}
			}
			return Ok(events);
		} catch (e) {
			return Err(e as Error);
		}
	}

	public async retrieveOutboxEvents(): Promise<
		Result<PrescriptionAggregateEventEnvlopeType[], Error>
	> {
		const fields = [
			"aggregate_type",
			"aggregate_id",
			"sequence",
			"event_type",
			"event_version",
			"payload",
			"metadata",
			"timestamp",
		];
		let query = this.connection.select(fields).from(OUTBOX_TABLE_NAME);
		if (this.instanceId) {
			query = query.where({
				instance_id: this.instanceId,
			});
		}
		try {
			const result = await query;
			const events: PrescriptionAggregateEventEnvlopeType[] = [];
			for (const event of result) {
				const raw_payload = JSON.parse(event["payload"]);
				switch (event["event_type"]) {
					case "PrescriptionCreated": {
						events.push(
							new PrescriptionAggregateEventEnvlope({
								aggregateId: event["aggregate_id"],
								aggregateType: event["aggregate_type"],
								sequence: event["sequence"],
								payload: new PrescriptionCreatedEvent({
									id: raw_payload["id"],
									patientId: raw_payload["patientId"],
									medicationId: raw_payload["medicationId"],
									address: raw_payload["address"],
									eventId: raw_payload["eventId"],
								}),
								metadata: event["metadata"],
								timestamp: new Date(event["timestamp"]),
							}),
						);
						break;
					}
					default:
						break;
				}
			}
			return Ok(events);
		} catch (e) {
			return Err(e as Error);
		}
	}

	public async sendAndDeleteOutboxEvent<O>(
		event: PrescriptionAggregateEventEnvlopeType,
		bus: EventBus<
			PrescriptionAggregateEventEnvlopeType,
			PrescriptionAggregateEventEnvlopeType
		>,
		topicMapper: (event: PrescriptionAggregateEventEnvlope) => string,
		transformer: (event: PrescriptionAggregateEventEnvlope) => Option<O>,
	): Promise<Result<undefined, Error>> {
		const deleteQuery = (tx: Knex.Transaction<any, any[]>) =>
			tx.table(OUTBOX_TABLE_NAME).delete().where({
				sequence: event.sequence,
			});
		let tx = await this.connection.transaction();
		try {
			await bus.sendEvent<O>(event, topicMapper, transformer);
			await deleteQuery(tx);
			await tx.commit();
		} catch (e) {
			await tx.rollback();
			return Err(e as Error);
		}
		return Ok(undefined);
	}
}
