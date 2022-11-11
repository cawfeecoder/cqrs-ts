import { Option, Result } from "@sniptt/monads";
import { EventBus } from "./eventBus";

export interface EventRepository<
  InboundEvent,
  OutboundEvent,
  InboundSnapshot,
  OutboundSnapshot
> {
  storeEvent: (event: InboundEvent) => Promise<Result<undefined, Error>>;
  retrieveEvents: (
    aggregateId: string,
    after: Option<string>
  ) => Promise<Result<Array<OutboundEvent>, Error>>;
  //   storeSnapshot: (
  //     snapshot: InboundSnapshot
  //   ) => Promise<Result<undefined, Error>>;
  //   retrieveLatestSnapshot: (
  //     aggregateId: string
  //   ) => Promise<Result<Option<OutboundSnapshot>, Error>>;
  //   retrieveOutboxEvents: () => Promise<Result<Array<OutboundEvent>, Error>>;
  //   sendAndDeleteOutboxEvent: (
  //     event: InboundEvent,
  //     bus: EventBus<InboundEvent, OutboundEvent>
  //   ) => Promise<Result<undefined, Error>>;
}
