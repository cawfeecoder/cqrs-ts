import { Result } from "@sniptt/monads";

export interface LockManager {
	lock: (aggregateId: string, ttl?: number, attempt?: number, timeout?: number) => Promise<Result<undefined, Error>>;
    unlock: (aggregateId: string) => Promise<Result<undefined, Error>>;
}
