import { EventBus } from "@common/application/ports/outbound/eventBus";
import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import { LockManager } from "@common/application/ports/outbound/lockManager";
import { AggregateSnapshot } from "@common/domain/entity";
import { NATSBus } from "@common/infrastructure/adapters/secondary/eventbus/nats";
import { RedisLockManager } from "@common/infrastructure/adapters/secondary/lockManager/redis";
import { ApplicationLogger } from "@common/utils/logger";
import { PrescriptionService } from "@prescription/application/service/prescription";
import {
  PrescriptionAggregate,
  PrescriptionAggregateEventEnvlopeType,
} from "@prescription/domain/entity/aggregate";
import { RESTPrescriptionAdapter } from "@prescription/infrastructure/adapters/primary/rest";
import { SqliteConnector } from "@prescription/infrastructure/adapters/secondary/sqlite";
import { RESTPrescription } from "@prescription/infrastructure/dtos/rest/prescription";
import axios from "axios";
import Docker from "dockerode";

describe("REST Prescription Service (SQLite, Redis, NATS)", () => {
  let repository:
    | EventRepository<
        PrescriptionAggregateEventEnvlopeType,
        PrescriptionAggregateEventEnvlopeType,
        AggregateSnapshot<PrescriptionAggregate>,
        AggregateSnapshot<PrescriptionAggregate>
      >
    | undefined;
  let eventbus:
    | EventBus<
        PrescriptionAggregateEventEnvlopeType,
        PrescriptionAggregateEventEnvlopeType
      >
    | undefined;
  let lockManager: LockManager | undefined;
  let natsContainer: Docker.Container;
  let redisContainer: Docker.Container;
  let containerPlatform: Docker;
  let service: PrescriptionService<RESTPrescription> | undefined;
  let inboundAdapter: RESTPrescriptionAdapter | undefined;
  try {
    containerPlatform = new Docker({
      socketPath:
        process.env["CONTAINER_SOCKET_PATH"] ?? "/var/run/docker.sock",
    });
  } catch (e) {
    console.error(e);
  }
  beforeEach(async () => {
    ApplicationLogger.getInstance()
      .enableJSON()
      .enableConsoleOutput("disabled");
    repository = new SqliteConnector({
      filename: ":memory:",
      migrationPath: "./migrations/sqlite",
    });
    await repository.migrate();

    if (containerPlatform) {
      const natsImage = await containerPlatform.pull("nats:latest");
      const redisImage = await containerPlatform.pull("redis:latest");

      await new Promise((res) =>
        containerPlatform.modem.followProgress(natsImage, res)
      );

      await new Promise((res) =>
        containerPlatform.modem.followProgress(redisImage, res)
      );

      natsContainer = await containerPlatform.createContainer({
        Image: "nats:latest",
        ExposedPorts: {
          "4222/tcp": {},
        },
        HostConfig: {
          PortBindings: {
            "4222/tcp": [
              {
                HostPort: "4222",
              },
            ],
          },
        },
      });
      await natsContainer.start();
      redisContainer = await containerPlatform.createContainer({
        Image: "redis:latest",
        ExposedPorts: {
          "6379/tcp": {},
        },
        HostConfig: {
          PortBindings: {
            "6379/tcp": [
              {
                HostPort: "6379",
              },
            ],
          },
        },
      });
      await redisContainer.start();

      lockManager = new RedisLockManager({ host: "localhost", port: 6379 });
      eventbus = new NATSBus<PrescriptionAggregateEventEnvlopeType>({
        address: "nats://localhost:4222",
      });
      service = new PrescriptionService({}, repository, lockManager);
      inboundAdapter = new RESTPrescriptionAdapter(service);
      await inboundAdapter.run();
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  afterEach(async () => {
    await inboundAdapter!.stop();
    repository = undefined;
    eventbus = undefined;
    service = undefined;
    lockManager = undefined;
    inboundAdapter = undefined;
    if (natsContainer) {
      await natsContainer.stop().catch((err) => {});
    }
    if (redisContainer) {
      await redisContainer.stop().catch((err) => {});
    }
    await new Promise((r) => setTimeout(r, 1000));
  });
  it("creates prescription when it receives a POST /prescription with valid information", async () => {
    //Act
    let response = await axios.post("http://0.0.0.0:3000/prescription", {
      medication_id: "test",
      patient_id: "test",
      address: "123 main street",
    });

    //Assert
    expect(response.headers["content-type"]).toMatch(/json/);
    expect(response.status).toEqual(200);
    expect(response.data.id).not.toEqual(undefined);
    expect(response.data.medicationId).toEqual("test");
    expect(response.data.patientId).toEqual("test");
    expect(response.data.address).toEqual("123 main street");
  });
});
