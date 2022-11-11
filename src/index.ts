import { None } from "@sniptt/monads/build";
import { PrescriptionService } from "./context/prescription/application/service/prescription";
import { RESTPrescriptionAdapter } from "./context/prescription/infrastructure/adapters/primary/rest";
import { RESTPrescription } from "./context/prescription/infrastructure/dtos/rest/prescription";
import {
  PrescriptionAggregate,
  PrescriptionAggregateEventEnvlope,
} from "./context/prescription/domain/entity/aggregate";
import { CreatePrescriptionCommand } from "./context/prescription/domain/entity/command";
import { SqliteConnector } from "./context/prescription/infrastructure/adapters/secondary/sqlite";

(async () => {
  try {
    let repository = new SqliteConnector({ filename: "test.db" });
    let service = new PrescriptionService<RESTPrescription>({}, repository);
    let restAdapter = new RESTPrescriptionAdapter(service);
    await restAdapter.run();
  } catch (err) {
    console.error(err);
    return process.exit(1);
  }
})();
