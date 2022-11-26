import { LockManager } from "@common/application/ports/outbound/lockManager";
import { Err, Ok, Result } from "@sniptt/monads/build";
import { createClient, RedisClientType } from "redis";

export class RedisLockManager implements LockManager {
  private client: RedisClientType<any>;
  private connected: boolean = false;

  public constructor({ host, port }: { host: string; port: number }) {
    this.client = createClient({
      socket: {
        host: host,
        port: port,
      },
    });
    this.client.on("error", (err) => {
      this.connected = false;
    });
    this.client.on("ready", (err) => {
      this.connected = true;
    });
    this.client.connect();
  }

  async lock(
    aggregateId: string,
    ttl: number = 30,
    attempt: number = 1,
    timeout: number = 250
  ): Promise<Result<undefined, Error>> {
    if (!this.connected) {
      return Err(
        new Error("Connection to LockManager closed. Attempting to reconnect")
      );
    }
    let exists = await this.client.EXISTS(aggregateId);
    if (exists) {
      if (attempt === 3) {
        return Err(new Error("Failed to acquire lock"));
      }
      await new Promise((r) => setTimeout(r, timeout));
      return this.lock(aggregateId, ttl, attempt + 1, timeout);
    }
    try {
      await this.client.SET(aggregateId, 1, {
        EX: ttl,
      });
      return Ok(undefined);
    } catch (err) {
      return Err(err as Error);
    }
  }

  async unlock(aggregateId: string): Promise<Result<undefined, Error>> {
    try {
        await this.client.DEL(aggregateId);
        return Ok(undefined);
    } catch (err) {
        return Err(err as Error);
    }
  }
}
