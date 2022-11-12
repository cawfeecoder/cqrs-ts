import { Err, None, Ok, Option, Result, Some } from "@sniptt/monads";
import { ulid } from "ulid";
import {
  Aggregate,
  AggregateSnapshot,
  EventEnvelope,
} from "@common/domain/entity";
import { createPrescriptionMachine } from "@prescription/domain/machine";
import {
  CreatePrescriptionCommand,
  PrescriptionCommand,
} from "@prescription/domain/entity/command";
import {
  PrescriptionError,
  PrescripionErrorTypes,
} from "@prescription/domain/entity/error";
import {
  PrescriptionCreatedEvent,
  PrescriptionEvent,
} from "@prescription/domain/entity/event";

export type PrescriptionAggregateType = Aggregate<
  PrescriptionCommand,
  PrescriptionEvent,
  PrescriptionError,
  {}
>;

export type PrescriptionAggregateEventEnvlopeType =
  EventEnvelope<PrescriptionEvent>;

export class PrescriptionAggregateEventEnvlope extends EventEnvelope<PrescriptionEvent> {}

export class PrescriptionAggregate
  implements
    Aggregate<PrescriptionCommand, PrescriptionEvent, PrescriptionError, {}>
{
  public id: Option<string> = None;
  public patientId: Option<string> = None;
  public medicationId: Option<string> = None;
  public address: Option<string> = None;
  public lastEvent: Option<PrescriptionEvent> = None;
  public appliedEvents: number = 0;

  aggregateType(): string {
    return "Prescription";
  }

  aggregateId(): Option<string> {
    return this.id;
  }

  async handle(
    command: PrescriptionCommand,
    services: {}
  ): Promise<Result<PrescriptionEvent, PrescriptionError>> {
    const machine = this.lastEvent.match({
      some: (val) => {
        switch (val.eventType()) {
          case "PrescriptionCreated":
            return createPrescriptionMachine("Created");
          default:
            return createPrescriptionMachine("New");
        }
      },
      none: createPrescriptionMachine("New"),
    });
    const { initialState } = machine;
    const { context } = machine.transition(initialState.value, {
      type: CreatePrescriptionCommand.name,
      command,
    });
    const { event } = context;
    const result: Result<PrescriptionEvent, PrescriptionError> = event.match({
      some: (val) => Ok(val) as Result<PrescriptionEvent, PrescriptionError>,
      none: Err(
        new PrescriptionError(
          "Prescription state machine failed to transition",
          PrescripionErrorTypes.StateMachineTransitionFail
        )
      ),
    });
    return result;
  }

  async apply(event: PrescriptionEvent): Promise<void> {
    this.appliedEvents += 1;
    switch (event.eventType()) {
      case "PrescriptionCreated":
        let evt = event as PrescriptionCreatedEvent;
        (this.id = Some(evt.id)), (this.patientId = Some(evt.patientId));
        this.medicationId = Some(evt.patientId);
        this.address = Some(evt.address);
        this.lastEvent = Some(event);
        break;
      default:
        break;
    }
  }

  snapshot(): Option<AggregateSnapshot<this>> {
    if (this.appliedEvents >= 10) {
      return Some(
        new AggregateSnapshot<this>({
          aggregateId: this.aggregateId().unwrap(),
          aggregateType: this.aggregateType(),
          payload: this,
          lastSequence: this.lastEvent.unwrap().eventId,
          snapshotId: ulid(),
          timestamp: new Date(),
        })
      );
    } else {
      return None;
    }
  }

  toString() {
    return JSON.stringify({
      id: this.id.isNone() ? "None" : this.id.unwrap(),
      patientId: this.patientId.isNone() ? "None" : this.patientId.unwrap(),
      medicationId: this.medicationId.isNone()
        ? "None"
        : this.medicationId.unwrap(),
      address: this.address.isNone() ? "None" : this.address.unwrap(),
      lastEvent: this.lastEvent.isNone() ? "None" : this.lastEvent.unwrap(),
      appliedEvents: this.appliedEvents,
    });
  }
}
