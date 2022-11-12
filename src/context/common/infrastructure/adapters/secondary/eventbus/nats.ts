import { Ok, Option, Result } from "@sniptt/monads/build";
import { connect, Events, JSONCodec, NatsConnection } from "nats";
import { Observable, SubscriptionObserver } from "observable-fns";
import { EventBus } from "../../../../application/ports/outbound/eventBus";

export class NATSBus<T, O> implements EventBus<T, T> {
  private bus?: NatsConnection;
  private connected: boolean = false;

  public constructor({ address }: { address: string }) {
    try {
      connect({
        maxReconnectAttempts: -1,
        timeout: 10000,
        reconnectTimeWait: 2000,
        waitOnFirstConnect: true,
        servers: address,
      }).then((nc) => {
        this.bus = nc;
        this.connected = true;
        (async () => {
          for await (const s of nc.status()) {
            if (s.type === Events.Reconnect) {
              this.connected = true;
            }
            if (s.type === Events.Disconnect) {
              this.connected = false;
            }
          }
        })();
      });
    } catch (err) {
      throw err;
    }
  }

  async sendEvent<O>(
    topic: string,
    event: T,
    transformer: (event: T) => Option<O>
  ): Promise<Result<boolean, Error>> {
    if (!this.connected) {
      throw new Error("Connection to bus closed. Attempting to reconnect");
    }
    const sc = JSONCodec();
    const transformed = transformer(event);
    const encoded = sc.encode(transformed.unwrap());
    this.bus!.publish(topic, encoded);
    return Ok(true);
  }

  async receiveEvents<I, P>(
    topic: string,
    mapper: (event: I) => P,
    transformer: (event: P) => Option<T>
  ): Promise<Observable<T>> {
    const sc = JSONCodec();
    let observableStream: SubscriptionObserver<any>;
    const observer = new Observable<any>((obs) => {
      observableStream = obs;
    });
    const sub = this.bus!.subscribe(topic);
    (async () => {
      for await (const m of sub) {
        let message = mapper(sc.decode(m.data) as I);
        let transformed = transformer(message);
        observableStream!.next(transformed.unwrap());
      }
    })();
    return observer;
  }
}
