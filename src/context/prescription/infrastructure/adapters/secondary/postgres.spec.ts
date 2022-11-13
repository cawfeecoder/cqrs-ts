import { ApplicationLogger } from "@common/utils/logger";
import { PrescriptionAggregateEventEnvlope } from "@prescription/domain/entity/aggregate";
import { PrescriptionCreatedEvent } from "@prescription/domain/entity/event";
import { None } from "@sniptt/monads/build";
import Docker from "dockerode";
import { PostgresConnector } from "./postgres";

describe("Prescription PostgresConnector", () => {
	jest.setTimeout(60000);
	let repository: PostgresConnector;
	let container: Docker.Container;
	let containerPlatform: Docker;
	try {
		if (!("CONTAINER_SOCKET_PATH" in process.env)) {
			throw new Error(
				"ENV Variable CONTAINER_SOCKET_PATH is not defined. Please set it before running adapter integration tests for Postgres",
			);
		}
		containerPlatform = new Docker({
			socketPath: process.env["CONTAINER_SOCKET_PATH"],
		});
	} catch (e) {
		console.error(e);
	}
	beforeEach(async () => {
		if (containerPlatform) {
			const image = await containerPlatform.pull("postgres:14");

			await new Promise((res) =>
				containerPlatform.modem.followProgress(image, res),
			);

			container = await containerPlatform.createContainer({
				Image: "postgres:14",
				Env: ["POSTGRES_PASSWORD=password"],
				HostConfig: {
					PortBindings: {
						"5432": [
							{
								HostPort: "5432",
							},
						],
					},
				},
			});
			await container.start();
			ApplicationLogger.getInstance()
				.enableJSON()
				.enableConsoleOutput("disabled");
			repository = new PostgresConnector({
				connectionString: "postgres://postgres:password@localhost:5432",
				migrationPath: "./migrations/sqlite",
			});
			await new Promise((r) => setTimeout(r, 1000));
		}
	});
	afterEach(async () => {
		if (container) {
			await container.stop().catch((err) => console.log("UNEXPECTED"));
			await new Promise((r) => setTimeout(r, 1000));
		}
	});
	it("runs migrations without erroring", async () => {
		await expect(repository.migrate()).resolves.not.toThrow();
	});
	it("stores a valid PrescriptionEvent", async () => {
		//Arange
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
		//Arange
		await repository.migrate();

		//Act
		let result = await repository.retrieveEvents("test", None);

		//Assert
		expect(result.isOk()).toEqual(true);
		expect(result.unwrap().length).toEqual(0);
	});
	it("retrieves an event when atleast one is previously inserted", async () => {
		//Arange
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
});
