import { None, Some } from "@sniptt/monads";
import { assign, State, StateNodeConfig } from "xstate";
import {
  CreatePrescriptionCommand,
  PrescriptionCommand,
} from "../../entity/command";
import { PrescriptionCreatedEvent } from "../../entity/event";
import { PrescriptionContext } from "../context";
import { CreatedState } from "./created";
import { ulid } from "ulid";

export const NewState = "New";

const New = {
  on: {
    [CreatePrescriptionCommand.name]: {
      target: CreatedState,
      actions: assign(
        (
          context: PrescriptionContext,
          event: {
            type: string;
            command: PrescriptionCommand;
          }
        ) => {
          const { medicationId, patientId, address } =
            event.command as CreatePrescriptionCommand;
          return {
            ...context,
            command: Some(event.command),
            event: Some(
              new PrescriptionCreatedEvent({
                id: ulid(),
                medicationId,
                patientId,
                address,
                eventId: ulid(),
              })
            ),
          };
        }
      ),
    },
  },
};

export default {
  New,
};
