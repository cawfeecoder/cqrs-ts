import { PrescriptionAggregate } from "./aggregate";
import { CreatePrescriptionCommand } from "./command";
import { PrescriptionCreatedEvent } from "./event";

describe("PrescriptionAggregate", () => {
	describe("handle commands", () => {
		it("should emit a PrescriptionCreated event when receives a CreatePrescriptionCommand", async () => {
			// Arange
			let command = new CreatePrescriptionCommand({
				medicationId: "test",
				patientId: "test",
				address: "test",
			});

			let aggregate = new PrescriptionAggregate();

			// Act
			let event = await aggregate.handle(command, {});

			//Assert
			expect(event.isOk());
			let unwrapped = event.unwrap() as PrescriptionCreatedEvent;
			expect(unwrapped.eventType()).toEqual("PrescriptionCreated");
			expect(unwrapped.address).toEqual("test");
			expect(unwrapped.medicationId).toEqual("test");
			expect(unwrapped.patientId).toEqual("test");
		});
	});
});
