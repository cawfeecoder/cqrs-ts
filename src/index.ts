import { PrescriptionService } from "@prescription/application/service/prescription";
import { RESTPrescriptionAdapter } from "@prescription/infrastructure/adapters/primary/rest";
import { RESTPrescription } from "@prescription/infrastructure/dtos/rest/prescription";
import { SqliteConnector } from "@prescription/infrastructure/adapters/secondary/sqlite";
import { ApplicationLogger } from "@common/utils/logger";
import { NATSBus } from "@common/infrastructure/adapters/secondary/eventbus/nats";
import { PrescriptionAggregateEventEnvlopeType } from "@prescription/domain/entity/aggregate";
import { PrescriptionCloudEvent } from "@prescription/infrastructure/dtos/eventbus/prescription";
import { GraphQLPrescriptionAdapter } from "@prescription/infrastructure/adapters/primary/graphql";
import { GraphQLPrescription } from "@prescription/infrastructure/dtos/graphql";

(async () => {
  const logger = ApplicationLogger.getInstance()
    .enableJSON()
    .enableConsoleOutput()
    .getLogger();
  try {
    let repository = new SqliteConnector({ filename: "test.db" });
    let service = new PrescriptionService<GraphQLPrescription>({}, repository);
    // let inboundAdapter = new RESTPrescriptionAdapter(service);
    let inboundAdapter = new GraphQLPrescriptionAdapter(service);
    let bus = new NATSBus<
      PrescriptionAggregateEventEnvlopeType,
      PrescriptionCloudEvent
    >({
      address: "localhost:4222",
    });

    setInterval(async () => {
      logger.info("Fetching outbox events to send to event bus");
      const outboxEvents = await repository.retrieveOutboxEvents();
      outboxEvents.match({
        ok: (val) => {
          logger.info("Retrieved outbox events", {
            count: val.length,
          });
          if (val.length > 100) {
            logger.info(
              "Too many events to process this internval, processing first 100"
            );
            val = val.slice(0, 100);
          }
          (async () => {
            for (const event of val) {
              const result =
                await repository.sendAndDeleteOutboxEvent<PrescriptionCloudEvent>(
                  event,
                  bus,
                  (event) => {
                    switch (event.payload.eventType()) {
                      case "PrescriptionCreated":
                        return "system.prescription.created";
                      default:
                        return "trash";
                    }
                  },
                  (event) => PrescriptionCloudEvent.from(event)
                );
              result.match({
                ok: () => {
                  logger.info("Successfully sent event from outbox", {
                    id: event.sequence,
                    event: event,
                  });
                },
                err: (err) => {
                  logger.error(err.message);
                },
              });
            }
          })();
        },
        err: (err) => {
          logger.error(err.message);
        },
      });
    }, 10000);

    await inboundAdapter.run(exports);
  } catch (err) {
    console.log(err);
    logger.error(err);
    return process.exit(1);
  }
})();
