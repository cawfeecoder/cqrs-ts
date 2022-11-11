import { DomainEvent } from "../../../common/domain/entity";

export interface PrescriptionEvent extends DomainEvent {}

export class PrescriptionCreatedEvent implements PrescriptionEvent {
  public id: string;
  public medicationId: string;
  public patientId: string;
  public address: string;
  private _eventId: string;

  public constructor({
    id,
    medicationId,
    patientId,
    address,
    eventId,
  }: {
    id: string;
    medicationId: string;
    patientId: string;
    address: string;
    eventId: string;
  }) {
    this.id = id;
    this.medicationId = medicationId;
    this.patientId = patientId;
    this.address = address;
    this._eventId = eventId;
  }

  eventType(): string {
    return "PrescriptionCreated";
  }

  eventVersion(): string {
    return "0.0.1";
  }

  eventId(): string {
    return this._eventId;
  }
}

export class PrescriptionUpdatedEvent implements PrescriptionEvent {
  public address: string;
  private _eventId: string;

  public constructor({
    address,
    eventId,
  }: {
    address: string;
    eventId: string;
  }) {
    this.address = address;
    this._eventId = eventId;
  }

  eventType(): string {
    return "PrescriptionUpdated";
  }

  eventVersion(): string {
    return "0.0.1";
  }

  eventId(): string {
    return this._eventId;
  }
}
