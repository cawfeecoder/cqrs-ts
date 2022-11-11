import { Result } from "@sniptt/monads";
import { Observable } from "observable-fns";

export interface EventBus<InboundEvent, OutboundEvent> {
  sendEvent: (event: InboundEvent) => Promise<Result<boolean, Error>>;
  receiveEvents: () => Promise<Observable<OutboundEvent>>;
}
