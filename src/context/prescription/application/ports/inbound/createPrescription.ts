import { Result } from "@sniptt/monads/build";
import { PrescriptionAggregate } from "@prescription/domain/entity/aggregate";
import { CreatePrescriptionCommand } from "@prescription/domain/entity/command";

export interface CreatePrescriptionUseCase<Output> {
  createPrescription: (
    command: CreatePrescriptionCommand,
    transform: (aggregate: PrescriptionAggregate) => Output
  ) => Promise<Result<Output, Error>>;
}
