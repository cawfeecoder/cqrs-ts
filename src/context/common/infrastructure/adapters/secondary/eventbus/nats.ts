import { Ok, Result } from "@sniptt/monads/build";
import mitt, { Emitter, EventType } from "mitt";
import { Observable, SubscriptionObserver } from "observable-fns";
import { EventBus } from "../../../../application/ports/outbound/eventBus";
import { DomainEvent } from "../../../../domain/entity";

export class MittBus<T extends DomainEvent> implements EventBus<T, T> {
  private bus = mitt<Record<EventType, T>>();

  async sendEvent(event: T): Promise<Result<boolean, Error>> {
    this.bus.emit(event.eventType(), event);
    return Ok(true);
  }

  async receiveEvents(): Promise<Observable<T>> {
    let observableStream: SubscriptionObserver<T>;
    const observer = new Observable<T>((obs) => {
      observableStream = obs;
    });
    this.bus.on("*", (_type, e) => {
      observableStream.next(e);
    });
    return observer;
  }
}
