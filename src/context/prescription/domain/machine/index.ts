import { None } from "@sniptt/monads";
import { createMachine } from "xstate";
import { PrescriptionCommand } from "@prescription/domain/entity/command";
import { PrescriptionContext } from "@prescription/domain/machine/context";
import Created from "@prescription/domain/machine/states/created";
import New from "@prescription/domain/machine/states/new";

export function createPrescriptionMachine(initialState: string) {
	return createMachine<
		PrescriptionContext,
		{
			type: string;
			command: PrescriptionCommand;
		}
	>({
		id: "prescription",
		context: {
			command: None,
			event: None,
			_services: {},
		},
		states: Object.assign(New, Created),
		initial: initialState,
		predictableActionArguments: true,
	});
}
