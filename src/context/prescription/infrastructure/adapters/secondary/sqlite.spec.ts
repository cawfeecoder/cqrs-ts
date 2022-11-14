import { EventBus } from "@common/application/ports/outbound/eventBus";
import { ApplicationLogger } from "@common/utils/logger";
import {
	PrescriptionAggregateEventEnvlope,
	PrescriptionAggregateEventEnvlopeType,
} from "@prescription/domain/entity/aggregate";
import { PrescriptionCreatedEvent } from "@prescription/domain/entity/event";
import { Err, None, Ok, Some } from "@sniptt/monads/build";
import { mock } from "jest-mock-extended";
import { SqliteConnector } from "./sqlite";

describe("Prescription SQLiteConnector", () => {
	let repository: SqliteConnector;
	const mockEventBus =
		mock<
			EventBus<
				PrescriptionAggregateEventEnvlopeType,
				PrescriptionAggregateEventEnvlopeType
			>
		>();
	mockEventBus.sendEvent.mockReturnValue(
		new Promise((resolve) => resolve(Ok(undefined))),
	);
	beforeEach(async () => {
		ApplicationLogger.getInstance()
			.enableJSON()
			.enableConsoleOutput("disabled");
		repository = new SqliteConnector({
			filename: ":memory:",
			migrationPath: "./migrations/sqlite",
		});
	});
	it("runs migrations without erroring", async () => {
		await expect(repository.migrate()).resolves.not.toThrow();
	});
	it("stores a valid PrescriptionEvent", async () => {
		// Arrange
		let event = new PrescriptionAggregateEventEnvlope({
			aggregateId: "test",
			aggregateType: "prescription",
			sequence: "test",
			payload: new PrescriptionCreatedEvent({
				id: "test",
				medicationId: "test",
				patientId: "test",
				address: "test",
				eventId: "test",
			}),
			metadata: {},
			timestamp: new Date(),
		});

		await repository.migrate();

		//Act
		let result = await repository.storeEvent(event);

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap()).toEqual(undefined);
	});
	it("retrieves no events when none are previously inserted", async () => {
		// Arrange
		await repository.migrate();

		//Act
		let result = await repository.retrieveEvents("test", None);

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap().length).toEqual(0);
	});
	it("retrieves an event when atleast one is previously inserted", async () => {
		// Arrange
		await repository.migrate();

		let event = new PrescriptionAggregateEventEnvlope({
			aggregateId: "test",
			aggregateType: "prescription",
			sequence: "test",
			payload: new PrescriptionCreatedEvent({
				id: "test",
				medicationId: "test",
				patientId: "test",
				address: "test",
				eventId: "test",
			}),
			metadata: {},
			timestamp: new Date(),
		});

		await repository.storeEvent(event);

		//Act
		let result = await repository.retrieveEvents("test", None);

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap().length).toEqual(1);
	});
	it("retrieves no outbox when none are previously inserted", async () => {
		// Arrange
		await repository.migrate();

		//Act
		let result = await repository.retrieveOutboxEvents();

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap().length).toEqual(0);
	});
	it("retrieves an outbox event when atleast one is previously inserted", async () => {
		// Arrange
		await repository.migrate();

		let event = new PrescriptionAggregateEventEnvlope({
			aggregateId: "test",
			aggregateType: "prescription",
			sequence: "test",
			payload: new PrescriptionCreatedEvent({
				id: "test",
				medicationId: "test",
				patientId: "test",
				address: "test",
				eventId: "test",
			}),
			metadata: {},
			timestamp: new Date(),
		});

		await repository.storeEvent(event);

		//Act
		let result = await repository.retrieveOutboxEvents();

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap().length).toEqual(1);
	});
	it("sends and deletes an outbox event when it can successfully talk to the event bus", async () => {
		// Arrange
		await repository.migrate();

		let event = new PrescriptionAggregateEventEnvlope({
			aggregateId: "test",
			aggregateType: "prescription",
			sequence: "test",
			payload: new PrescriptionCreatedEvent({
				id: "test",
				medicationId: "test",
				patientId: "test",
				address: "test",
				eventId: "test",
			}),
			metadata: {},
			timestamp: new Date(),
		});

		await repository.storeEvent(event);

		const events = await (await repository.retrieveOutboxEvents()).unwrap();

		//Act
		let result = await repository.sendAndDeleteOutboxEvent(
			events[0],
			mockEventBus,
			(event) => "test",
			(event) => Some(event),
		);

		let eventsAfterSend = await (
			await repository.retrieveOutboxEvents()
		).unwrap();

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap()).toEqual(undefined);
		expect(eventsAfterSend.length).toEqual(0);
	});
	it("errors when sending an outbox event when it can't successfully talk to the event bus", async () => {
		jest.setTimeout(7500);
		// Arrange
		await repository.migrate();

		let event = new PrescriptionAggregateEventEnvlope({
			aggregateId: "test",
			aggregateType: "prescription",
			sequence: "test",
			payload: new PrescriptionCreatedEvent({
				id: "test",
				medicationId: "test",
				patientId: "test",
				address: "test",
				eventId: "test",
			}),
			metadata: {},
			timestamp: new Date(),
		});

		await repository.storeEvent(event);

		const events = await (await repository.retrieveOutboxEvents()).unwrap();

		mockEventBus.sendEvent.mockReturnValue(
			new Promise((resolve) => {
				resolve(Err(new Error("Failed to talk to event bus")));
			}),
		);

		//Act
		let result = await repository.sendAndDeleteOutboxEvent(
			events[0],
			mockEventBus,
			(event) => "test",
			(event) => Some(event),
		);

		let eventsAfterSend = await (
			await repository.retrieveOutboxEvents()
		).unwrap();

		//Assert
		expect(result.isErr()).toEqual(true);
		expect(eventsAfterSend.length).toEqual(1);
	});
});
