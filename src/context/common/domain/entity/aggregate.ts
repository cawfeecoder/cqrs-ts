import { Option, Result } from "@sniptt/monads";
import { AggregateSnapshot, DomainEvent } from "./event";

export interface Aggregate<
	Command,
	Event extends DomainEvent,
	Error,
	Services,
> {
	aggregateType: () => string;
	aggregateId: () => Option<string>;
	handle: (
		command: Command,
		service: Services,
	) => Promise<Result<Event, Error>>;
	apply: (event: Event) => Promise<void>;
	snapshot: () => Option<AggregateSnapshot<this>>;
}
