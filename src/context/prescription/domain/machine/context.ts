import { Option } from "@sniptt/monads";
import { PrescriptionCommand } from "../entity/command";
import { PrescriptionEvent } from "../entity/event";

export type PrescriptionContext = {
  command: Option<PrescriptionCommand>;
  event: Option<PrescriptionEvent>;
  _services: {};
};
