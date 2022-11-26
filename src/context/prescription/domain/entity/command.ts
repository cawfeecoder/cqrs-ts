export interface PrescriptionCommand {
	name(): string
}

export class CreatePrescriptionCommand implements PrescriptionCommand {
	public medicationId: string;
	public patientId: string;
	public address: string;

	public constructor({
		medicationId,
		patientId,
		address,
	}: {
		medicationId: string;
		patientId: string;
		address: string;
	}) {
		this.medicationId = medicationId;
		this.patientId = patientId;
		this.address = address;
	}
	
	public name() {
		return "CreatePrescriptionCommand"
	}
}

export class UpdatePrescriptionCommand implements PrescriptionCommand {
	public id: string;
	public address: string;

	public constructor({ id, address }: { id: string; address: string }) {
		this.id = id;
		this.address = address;
	}

	public name() {
		return "UpdatePrescriptionCommand"
	}
}
