import { PrescriptionService } from "./prescription";
import {
  CreatePrescriptionCommand,
  UpdatePrescriptionCommand,
} from "../../domain/entity/command";
import {
  PrescriptionAggregate,
  PrescriptionAggregateEventEnvlope,
} from "../../domain/entity/aggregate";
import { PrescriptionAggregateEventEnvlopeType } from "../../domain/entity/aggregate";
import { EventRepository } from "@common/application/ports/outbound/eventRepository";
import { mock } from "jest-mock-extended";
import { LockManager } from "@common/application/ports/outbound/lockManager";
import { Err, Ok, Some } from "@sniptt/monads";
import { ulid } from "ulid";

let service: PrescriptionService<PrescriptionAggregate>;
const mockRepository =
  mock<
    EventRepository<
      PrescriptionAggregateEventEnvlopeType,
      PrescriptionAggregateEventEnvlopeType,
      PrescriptionAggregate,
      PrescriptionAggregate
    >
  >();
const mockLockManager = mock<LockManager>();
describe("PrescriptionService", () => {
  beforeAll(() => {
    mockRepository.storeEvent.mockReturnValue(
      new Promise((resolve) => resolve(Ok(undefined)))
    );
    service = new PrescriptionService<PrescriptionAggregate>(
      {},
      mockRepository,
      mockLockManager
    );
  });
  describe("can create prescription", () => {
    it("should emit a PrescriptionAggreagte when a valid CreatePrescription command is passed", async () => {
      //  Arrange
      let command = new CreatePrescriptionCommand({
        medicationId: "test",
        patientId: "test",
        address: "123 main street",
      });

      // Act
      let result = await service.createPrescription(command, (x) => x);

      //Assert
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().id.isSome()).toBe(true);
      expect(result.unwrap().medicationId.unwrap()).toBe("test");
      expect(result.unwrap().patientId.unwrap()).toBe("test");
      expect(result.unwrap().address.unwrap()).toBe("123 main street");
    });
  });
  describe("can update prescription", () => {
    it("should emit an updated PrescriptionAggreagte when we attempt to update an existing Prescription and it is not locked", async () => {
      //  Arrange
      let _command = new CreatePrescriptionCommand({
        medicationId: "test",
        patientId: "test",
        address: "123 main street",
      });

      let _result = await service.createPrescription(_command, (x) => x);

      mockRepository.aggregateExists.mockReturnValue(
        new Promise((resolve) => resolve(Ok(undefined)))
      );

      mockRepository.retrieveEvents.mockReturnValue(
        new Promise((resolve) => {
          resolve(
            Ok(
              [_result.unwrap().lastEvent.unwrap()].map(
                (x) =>
                  new PrescriptionAggregateEventEnvlope({
                    aggregateId: _result.unwrap().aggregateId().unwrap(),
                    aggregateType: _result.unwrap().aggregateType(),
                    sequence: ulid(),
                    payload: x,
                    metadata: {},
                    timestamp: new Date(),
                  })
              )
            )
          );
        })
      );

      mockLockManager.lock.mockReturnValue(
        new Promise((resolve) => resolve(Ok(undefined)))
      );

      mockLockManager.unlock.mockReturnValue(
        new Promise((resolve) => resolve(Ok(undefined)))
      );

      let command = new UpdatePrescriptionCommand({
        id: _result.unwrap().id.unwrap(),
        address: "1234 main street",
      });
      // Act
      let result = await service.updatePrescription(command, (x) => x);

      //Assert
      expect(result.isOk()).toBe(true);
      expect(result.unwrap().id.isSome()).toBe(true);
      expect(result.unwrap().medicationId.unwrap()).toBe("test");
      expect(result.unwrap().patientId.unwrap()).toBe("test");
      expect(result.unwrap().address.unwrap()).toBe("1234 main street");
    });
    it("should emit an Error when we attempt to update an existing Prescription and it is locked", async () => {
      //  Arrange
      let _command = new CreatePrescriptionCommand({
        medicationId: "test",
        patientId: "test",
        address: "123 main street",
      });

      let _result = await service.createPrescription(_command, (x) => x);

      mockRepository.aggregateExists.mockReturnValue(
        new Promise((resolve) => resolve(Ok(undefined)))
      );

      mockRepository.retrieveEvents.mockReturnValue(
        new Promise((resolve) => {
          resolve(
            Ok(
              [_result.unwrap().lastEvent.unwrap()].map(
                (x) =>
                  new PrescriptionAggregateEventEnvlope({
                    aggregateId: _result.unwrap().aggregateId().unwrap(),
                    aggregateType: _result.unwrap().aggregateType(),
                    sequence: ulid(),
                    payload: x,
                    metadata: {},
                    timestamp: new Date(),
                  })
              )
            )
          );
        })
      );

      mockLockManager.lock.mockReturnValue(
        new Promise((resolve) =>
          resolve(Err(new Error("Failed to acquire lock")))
        )
      );

      let command = new UpdatePrescriptionCommand({
        id: _result.unwrap().id.unwrap(),
        address: "1234 main street",
      });
      // Act
      let result = await service.updatePrescription(command, (x) => x);

      //Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe("Failed to acquire lock");
    });
    it("should emit an Error when we attempt to update a non-existing Prescription", async () => {
      //  Arrange
      mockRepository.aggregateExists.mockReturnValue(
        new Promise((resolve) =>
          resolve(Err(new Error(`No aggregate with id test found`)))
        )
      );

      let command = new UpdatePrescriptionCommand({
        id: "test",
        address: "1234 main street",
      });
      // Act
      let result = await service.updatePrescription(command, (x) => x);

      //Assert
      expect(result.isErr()).toBe(true);
      expect(result.unwrapErr().message).toBe(
        `No aggregate with id test found`
      );
    });
  });
});
