import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import { AggregateSnapshot } from "@common/domain/entity";
import { ApplicationLogger } from "@common/utils/logger";
import { CreatePrescriptionUseCase } from "@prescription/application/ports/inbound/createPrescription";
import { PrescriptionService } from "@prescription/application/service/prescription";
import {
	PrescriptionAggregate,
	PrescriptionAggregateEventEnvlopeType,
} from "@prescription/domain/entity/aggregate";
import { RESTPrescription } from "@prescription/infrastructure/dtos/rest/prescription";
import { Ok } from "@sniptt/monads/build";
import axios, { Axios } from "axios";
import { mock } from "jest-mock-extended";
import { RESTPrescriptionAdapter } from "./rest";

describe("Prescription REST Adapter", () => {
	let restAdapter: RESTPrescriptionAdapter;
	beforeAll(async () => {
		const mockRepository =
			mock<
				EventRepository<
					PrescriptionAggregateEventEnvlopeType,
					PrescriptionAggregateEventEnvlopeType,
					AggregateSnapshot<PrescriptionAggregate>,
					AggregateSnapshot<PrescriptionAggregate>
				>
			>();
		mockRepository.storeEvent.mockReturnValue(
			new Promise((resolve) => resolve(Ok(undefined))),
		);
		ApplicationLogger.getInstance()
			.enableJSON()
			.enableConsoleOutput("disabled");
		const service = new PrescriptionService<RESTPrescription>(
			{},
			mockRepository,
		);
		restAdapter = await new RESTPrescriptionAdapter(service);
	});

	it("creates a prescription when valid payload provided", async () => {
		// Arrange
		const expected = {
			patientId: "test",
			medicationId: "test",
			address: "test",
		};

		const payload = {
			address: "test",
			medication_id: "test",
			patient_id: "test",
		};

		// Act
		const response = await restAdapter.getApp().inject({
			method: "POST",
			url: "/prescription",
			payload: payload,
		});

		// // Assert
		expect(JSON.parse(response.body).patientId).toEqual(expected.patientId);
		expect(JSON.parse(response.body).medicationId).toEqual(
			expected.medicationId,
		);
		expect(JSON.parse(response.body).address).toEqual(expected.address);
	});
	it("returns an error when a patientId is missing", async () => {
		// Arrange
		const expected = {
			errors: [
				{
					type: "invalid_request_error",
					code: "parameter_missing",
					message: "We expected a value for patient_id, but none was provided",
					param: "patient_id",
				},
			],
		};

		const payload = {
			medication_id: "test",
			address: "test",
		};

		// Act
		const response = await restAdapter.getApp().inject({
			method: "POST",
			url: "/prescription",
			payload: payload,
		});

		// Assert
		expect(JSON.parse(response.body).errors.length).toEqual(1);
		expect(JSON.parse(response.body).errors).toEqual(expected.errors);
	});
	it("returns an error when a medicationId is missing", async () => {
		// Arrange
		const expected = {
			errors: [
				{
					type: "invalid_request_error",
					code: "parameter_missing",
					message:
						"We expected a value for medication_id, but none was provided",
					param: "medication_id",
				},
			],
		};

		const payload = {
			patient_id: "test",
			address: "test",
		};

		// Act
		const response = await restAdapter.getApp().inject({
			method: "POST",
			url: "/prescription",
			payload: payload,
		});

		// Assert
		expect(JSON.parse(response.body).errors.length).toEqual(1);
		expect(JSON.parse(response.body).errors).toEqual(expected.errors);
	});
	it("returns an error when a address is missing", async () => {
		// Arrange
		const expected = {
			errors: [
				{
					type: "invalid_request_error",
					code: "parameter_missing",
					message: "We expected a value for address, but none was provided",
					param: "address",
				},
			],
		};

		const payload = {
			medication_id: "test",
			patient_id: "test",
		};

		// Act
		const response = await restAdapter.getApp().inject({
			method: "POST",
			url: "/prescription",
			payload: payload,
		});

		// Assert
		expect(JSON.parse(response.body).errors.length).toEqual(1);
		expect(JSON.parse(response.body).errors).toEqual(expected.errors);
	});
	it("returns errors when payload is empty", async () => {
		// Arrange
		const expected = {
			errors: [
				{
					type: "invalid_request_error",
					code: "parameter_missing",
					message:
						"We expected a value for medication_id, but none was provided",
					param: "medication_id",
				},
				{
					type: "invalid_request_error",
					code: "parameter_missing",
					message: "We expected a value for patient_id, but none was provided",
					param: "patient_id",
				},
				{
					type: "invalid_request_error",
					code: "parameter_missing",
					message: "We expected a value for address, but none was provided",
					param: "address",
				},
			],
		};

		// Act
		const response = await restAdapter.getApp().inject({
			method: "POST",
			url: "/prescription",
			payload: {},
		});

		// Assert
		expect(JSON.parse(response.body).errors.length).toEqual(3);
		expect(JSON.parse(response.body).errors).toEqual(expected.errors);
	});
});
