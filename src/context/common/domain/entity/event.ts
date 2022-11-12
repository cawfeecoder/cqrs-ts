export interface DomainEvent {
  eventType: () => string;
  eventVersion: () => string;
  eventId: string;
  toString: () => string;
}

export class AggregateSnapshot<S> {
  public aggregateId: string;
  public aggregateType: string;
  public payload: S;
  public lastSequence: string;
  public snapshotId: string;
  public timestamp: Date;

  public constructor({
    aggregateId,
    aggregateType,
    payload,
    lastSequence,
    snapshotId,
    timestamp,
  }: {
    aggregateId: string;
    aggregateType: string;
    payload: S;
    lastSequence: string;
    snapshotId: string;
    timestamp: Date;
  }) {
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.payload = payload;
    this.lastSequence = lastSequence;
    this.snapshotId = snapshotId;
    this.timestamp = timestamp;
  }
}

export class EventEnvelope<Event extends DomainEvent> {
  public aggregateId: string;
  public aggregateType: string;
  public sequence: string;
  public payload: Event;
  public metadata: Record<string, string>;
  public timestamp: Date;

  public constructor({
    aggregateId,
    aggregateType,
    sequence,
    payload,
    metadata,
    timestamp,
  }: {
    aggregateId: string;
    aggregateType: string;
    sequence: string;
    payload: Event;
    metadata: Record<string, string>;
    timestamp: Date;
  }) {
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.sequence = sequence;
    this.payload = payload;
    this.metadata = metadata;
    this.timestamp = timestamp;
  }
}
