import { Option } from "@sniptt/monads";
import { PrescriptionCommand } from "@prescription/domain/entity/command";
import { PrescriptionEvent } from "@prescription/domain/entity/event";

export type PrescriptionContext = {
	command: Option<PrescriptionCommand>;
	event: Option<PrescriptionEvent>;
	_services: {};
};
