import { Err, Ok, Result } from "@sniptt/monads/build";
import fastify from "fastify";
import { PrescriptionAggregate } from "../../../domain/entity/aggregate";
import { CreatePrescriptionCommand } from "../../../domain/entity/command";
import { createPrescriptionMachine } from "../../../domain/machine";
import { CreatePrescriptionUseCase } from "../../../application/inbound/createPrescription";
import { PrescriptionService } from "../../../application/service/prescription";
import { RESTPrescription } from "../../dtos/rest/prescription";

interface PrescriptionMutation {
  medication_id?: string;
  patient_id?: string;
  address?: string;
}

export class RESTPrescriptionAdapter {
  private service: CreatePrescriptionUseCase<RESTPrescription>;
  private app;

  public constructor(service: CreatePrescriptionUseCase<RESTPrescription>) {
    this.service = service;
    this.app = fastify({ logger: true });
    this.app.post<{ Body: PrescriptionMutation }>(
      "/prescription",
      async (req, res) => {
        let errors = [];
        let { medication_id, patient_id, address } = req.body;
        if (!medication_id) {
          errors.push({
            type: "invalid_request_error",
            code: "parameter_missing",
            message:
              "We expected a value for medication_id, but none was provided",
            param: "medication_id",
          });
        }
        if (!patient_id) {
          errors.push({
            type: "invalid_request_error",
            code: "parameter_missing",
            message:
              "We expected a value for patient_id, but none was provided",
            param: "patient_id",
          });
        }
        if (!address) {
          errors.push({
            type: "invalid_request_error",
            code: "parameter_missing",
            message: "We expected a value for address, but none was provided",
            param: "address",
          });
        }
        if (errors.length > 0) {
          res.send({
            errors,
          });
        }
        let command = new CreatePrescriptionCommand({
          medicationId: medication_id!,
          patientId: patient_id!,
          address: address!,
        });
        let result = await this.service.createPrescription(
          command,
          (aggregate) => RESTPrescription.from(aggregate)
        );
        result.match({
          ok: (val) => res.send(val),
          err: () => res.status(500),
        });
      }
    );
  }

  public async run(): Promise<Result<undefined, Error>> {
    try {
      await this.app.listen({ port: 3000 });
      return Ok(undefined);
    } catch (e) {
      return Err(e as Error);
    }
  }
}
