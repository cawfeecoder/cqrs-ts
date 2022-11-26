import { Err, Ok, Result } from "@sniptt/monads/build";
import fastify from "fastify";
import { CreatePrescriptionCommand, UpdatePrescriptionCommand } from "@prescription/domain/entity/command";
import { CreatePrescriptionUseCase } from "@prescription/application/ports/inbound/createPrescription";
import { RESTPrescription } from "@prescription/infrastructure/dtos/rest/prescription";
import { requireParams } from "@common/utils/rest";
import { ApplicationLogger } from "@common/utils/logger";
import { PrescriptionService } from "@prescription/application/service/prescription";

interface PrescriptionMutation {
	medication_id?: string;
	patient_id?: string;
	address?: string;
}

export class RESTPrescriptionAdapter {
	private service: PrescriptionService<RESTPrescription>;
	private app;
	private logger;

	public constructor(service: PrescriptionService<RESTPrescription>) {
		this.service = service;
		this.logger = ApplicationLogger.getInstance().getLogger();
		this.app = fastify({ logger: false });
		this.app.addContentTypeParser(
			"application/json",
			{ parseAs: "string" },
			function (req, body: string, done) {
				try {
					var json = JSON.parse(body);
					done(null, json);
				} catch (err) {
					done(null, {});
				}
			},
		);
		this.app.post<{ Body: PrescriptionMutation }>(
			"/prescription",
			async (req, res) => {
				let { medication_id, patient_id, address } = req.body;
				const errors = requireParams({
					medication_id,
					patient_id,
					address,
				});
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
					(aggregate) => RESTPrescription.from(aggregate),
				);
				result.match({
					ok: (val) => res.send(val),
					err: (err) => {
						this.logger.error(err);
						return res.status(500);
					},
				});
			},
		);
		this.app.put<{ Body: PrescriptionMutation, Params: { id: string } }>(
			"/prescription/:id",
			async (req, res) => {
				let { address } = req.body;
				let { id } = req.params ;
				const errors = requireParams({
					address,
				});
				if (errors.length > 0) {
					res.send({
						errors,
					});
				}
				let command = new UpdatePrescriptionCommand({
					id: id,
					address: address!,
				});
				let result = await this.service.updatePrescription(
					command,
					(aggregate) => RESTPrescription.from(aggregate),
				);
				result.match({
					ok: (val) => res.send(val),
					err: (err) => {
						this.logger.error(err.message);
						return res.status(500);
					},
				});
			},
		);
	}

	public getApp() {
		return this.app;
	}

	public async run(...args: any[]): Promise<Result<undefined, Error>> {
		try {
			await this.app.listen({ port: 3000 }, (err, address) => {
				if (err) {
					this.logger.error(err.message);
				}
				this.logger.info("Prescription REST service started", {
					address: address,
				});
			});
			return Ok(undefined);
		} catch (e) {
			return Err(e as Error);
		}
	}
}
