import { Result } from "@sniptt/monads/build";
import { PrescriptionAggregate } from "@prescription/domain/entity/aggregate";
import { UpdatePrescriptionCommand } from "@prescription/domain/entity/command";

export interface UpdatePrescriptionUseCase<Output> {
	updatePrescription: (
		command: UpdatePrescriptionCommand,
		transform: (aggregate: PrescriptionAggregate) => Output,
	) => Promise<Result<Output, Error>>;
}
