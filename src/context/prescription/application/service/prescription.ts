import { Err, None, Ok, Result } from "@sniptt/monads/build";
import {
	PrescriptionAggregate,
	PrescriptionAggregateEventEnvlope,
} from "@prescription/domain/entity/aggregate";
import { CreatePrescriptionCommand, UpdatePrescriptionCommand } from "@prescription/domain/entity/command";
import { AggregateSnapshot } from "@common/domain/entity";
import { CreatePrescriptionUseCase } from "@prescription/application/ports/inbound/createPrescription";
import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import { UpdatePrescriptionUseCase } from "../ports/inbound/updatePrescription";
import { LockManager } from "@common/application/ports/outbound/lockManager";

export class PrescriptionService<Output>
	implements CreatePrescriptionUseCase<Output>, UpdatePrescriptionUseCase<Output>
{
	private services = {};
	private repository: EventRepository<
		PrescriptionAggregateEventEnvlope,
		PrescriptionAggregateEventEnvlope,
		AggregateSnapshot<PrescriptionAggregate>,
		AggregateSnapshot<PrescriptionAggregate>
	>;
	private lockManager: LockManager;

	public constructor(
		services: {},
		repository: EventRepository<
			PrescriptionAggregateEventEnvlope,
			PrescriptionAggregateEventEnvlope,
			AggregateSnapshot<PrescriptionAggregate>,
			AggregateSnapshot<PrescriptionAggregate>
		>,
		lockManager: LockManager
	) {
		this.services = services;
		this.repository = repository;
		this.lockManager = lockManager;
	}

	public async createPrescription(
		command: CreatePrescriptionCommand,
		transform: (aggregate: PrescriptionAggregate) => Output,
	): Promise<Result<Output, Error>> {
		let aggregate = new PrescriptionAggregate();
		let event = await aggregate.handle(command, this.services);
		if (event.isErr()) {
			return Err(event.unwrapErr());
		}
		aggregate.apply(event.unwrap());
		let wrappedEvent = event
			.map(
				(evt) =>
					new PrescriptionAggregateEventEnvlope({
						aggregateId: aggregate.id.unwrap(),
						aggregateType: aggregate.aggregateType(),
						sequence: evt.eventId,
						payload: evt,
						metadata: {},
						timestamp: new Date(),
					}),
			)
			.unwrap();
		let result = await this.repository.storeEvent(wrappedEvent);
		if (result.isErr()) {
			return Err(result.unwrapErr());
		}
		let snapshot = aggregate.snapshot();
		if (snapshot.isSome()) {
			console.log("Unimplemented: Store Snapshot");
		}
		return Ok(transform(aggregate));
	}

	public async updatePrescription(
		command: UpdatePrescriptionCommand,
		transform: (aggregate: PrescriptionAggregate) => Output,
	): Promise<Result<Output, Error>> {
		let exists = await this.repository.aggregateExists(command.id);
		if (exists.isErr()) {
			return Err(exists.unwrapErr())
		}
		let lockResult = await this.lockManager.lock(command.id);
		if (lockResult.isErr()) {
			return Err(lockResult.unwrapErr())
		}
		let aggregate = new PrescriptionAggregate();
		let historical = await this.repository.retrieveEvents(command.id, None);
		if (historical.isErr()) {
			await this.lockManager.unlock(command.id);
			return Err(historical.unwrapErr())
		}
		for (const historicalEvent of historical.unwrap()) {
			aggregate.apply(historicalEvent.payload);
		}
		let event = await aggregate.handle(command, this.services);
		if (event.isErr()) {
			await this.lockManager.unlock(command.id);
			return Err(event.unwrapErr());
		}
		aggregate.apply(event.unwrap());
		let wrappedEvent = event
			.map(
				(evt) =>
					new PrescriptionAggregateEventEnvlope({
						aggregateId: aggregate.id.unwrap(),
						aggregateType: aggregate.aggregateType(),
						sequence: evt.eventId,
						payload: evt,
						metadata: {},
						timestamp: new Date(),
					}),
			)
			.unwrap();
		let result = await this.repository.storeEvent(wrappedEvent);
		if (result.isErr()) {
			await this.lockManager.unlock(command.id);
			return Err(result.unwrapErr());
		}
		let snapshot = aggregate.snapshot();
		if (snapshot.isSome()) {
			console.log("Unimplemented: Store Snapshot");
		}
		await this.lockManager.unlock(command.id);
		return Ok(transform(aggregate));
	}
}
