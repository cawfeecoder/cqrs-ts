import { Err, Ok, Result } from "@sniptt/monads/build";
import {
  PrescriptionAggregate,
  PrescriptionAggregateEventEnvlope,
} from "@prescription/domain/entity/aggregate";
import { CreatePrescriptionCommand } from "@prescription/domain/entity/command";
import { AggregateSnapshot } from "@common/domain/entity";
import { CreatePrescriptionUseCase } from "@prescription/application/ports/inbound/createPrescription";
import { EventRepository } from "@common/application/ports/outbound/eventRepository";

export class PrescriptionService<Output>
  implements CreatePrescriptionUseCase<Output>
{
  private services = {};
  private repository: EventRepository<
    PrescriptionAggregateEventEnvlope,
    PrescriptionAggregateEventEnvlope,
    AggregateSnapshot<PrescriptionAggregate>,
    AggregateSnapshot<PrescriptionAggregate>
  >;

  public constructor(
    services: {},
    repository: EventRepository<
      PrescriptionAggregateEventEnvlope,
      PrescriptionAggregateEventEnvlope,
      AggregateSnapshot<PrescriptionAggregate>,
      AggregateSnapshot<PrescriptionAggregate>
    >
  ) {
    this.services = services;
    this.repository = repository;
  }

  public async createPrescription(
    command: CreatePrescriptionCommand,
    transform: (aggregate: PrescriptionAggregate) => Output
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
          })
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
}
