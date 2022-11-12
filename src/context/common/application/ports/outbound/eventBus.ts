import { From } from "@common/domain/entity";
import { Option, Result } from "@sniptt/monads";
import { Observable } from "observable-fns";

export interface EventBus<InboundEvent, OutboundEvent> {
  sendEvent<O>(
    topic: string,
    event: InboundEvent,
    transformer: (event: InboundEvent) => Option<O>
  ): Promise<Result<boolean, Error>>;
  receiveEvents<Inbound, Parsed>(
    topic: string,
    mapper: (event: Inbound) => Parsed,
    transformer: (event: Parsed) => Option<OutboundEvent>
  ): Promise<Observable<OutboundEvent>>;
}
