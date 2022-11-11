import { None } from "@sniptt/monads";
import { createMachine } from "xstate";
import { PrescriptionCommand } from "../entity/command";
import { PrescriptionContext } from "./context";
import Created from "./states/created";
import New from "./states/new";

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
    initial: "New",
    predictableActionArguments: true,
  });
}
