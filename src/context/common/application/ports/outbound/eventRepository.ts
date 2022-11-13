import { DomainEvent, EventEnvelope, From } from "@common/domain/entity";
import { Option, Result } from "@sniptt/monads";
import { EventBus } from "./eventBus";

export interface EventRepository<
	InboundEvent extends EventEnvelope<DomainEvent>,
	OutboundEvent extends EventEnvelope<DomainEvent>,
	InboundSnapshot,
	OutboundSnapshot,
> {
	storeEvent: (event: InboundEvent) => Promise<Result<undefined, Error>>;
	retrieveEvents: (
		aggregateId: string,
		after: Option<string>,
	) => Promise<Result<OutboundEvent[], Error>>;
	//   storeSnapshot: (
	//     snapshot: InboundSnapshot
	//   ) => Promise<Result<undefined, Error>>;
	//   retrieveLatestSnapshot: (
	//     aggregateId: string
	//   ) => Promise<Result<Option<OutboundSnapshot>, Error>>;
	retrieveOutboxEvents: () => Promise<Result<OutboundEvent[], Error>>;
	sendAndDeleteOutboxEvent<O>(
		event: InboundEvent,
		bus: EventBus<InboundEvent, OutboundEvent>,
		topicMapper: (event: InboundEvent) => string,
		transformer: (event: InboundEvent) => Option<O>,
	): Promise<Result<undefined, Error>>;
}
