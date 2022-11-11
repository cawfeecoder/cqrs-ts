import { Result } from "@sniptt/monads/build";
import { PrescriptionAggregate } from "../../domain/entity/aggregate";
import { CreatePrescriptionCommand } from "../../domain/entity/command";
import { From } from "../../../common/domain/entity/traits";

export interface CreatePrescriptionUseCase<Output> {
  createPrescription: (
    command: CreatePrescriptionCommand,
    transform: (aggregate: PrescriptionAggregate) => Output
  ) => Promise<Result<Output, Error>>;
}
