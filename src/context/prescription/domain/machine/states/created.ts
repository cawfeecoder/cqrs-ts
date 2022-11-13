import { Some } from "@sniptt/monads";
import { ulid } from "ulid";
import { assign } from "xstate";
import {
	PrescriptionCommand,
	UpdatePrescriptionCommand,
} from "@prescription/domain/entity/command";
import { PrescriptionUpdatedEvent } from "@prescription/domain/entity/event";
import { PrescriptionContext } from "@prescription/domain/machine/context";

export const CreatedState = "Created";

const Created = {
	on: {
		[UpdatePrescriptionCommand.name]: {
			target: CreatedState,
			actions: assign(
				(
					context: PrescriptionContext,
					event: {
						type: string;
						command: PrescriptionCommand;
					},
				) => {
					const { id, address } = event.command as UpdatePrescriptionCommand;
					return {
						...context,
						command: Some(event.command),
						event: Some(
							new PrescriptionUpdatedEvent({
								address,
								eventId: ulid(),
							}),
						),
					};
				},
			),
		},
	},
};

export default {
	Created,
};
