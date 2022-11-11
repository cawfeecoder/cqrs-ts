import { PrescriptionAggregate } from "../../../domain/entity/aggregate";
import {
  From,
  staticImplements,
} from "../../../../common/domain/entity/traits";

@staticImplements<From<PrescriptionAggregate, RESTPrescription>>()
export class RESTPrescription {
  id: string;
  patientId: string;
  medicationId: string;
  address: string;

  public constructor({
    id,
    patientId,
    medicationId,
    address,
  }: {
    id: string;
    patientId: string;
    medicationId: string;
    address: string;
  }) {
    this.id = id;
    this.patientId = patientId;
    this.medicationId = medicationId;
    this.address = address;
  }

  public static from(val: PrescriptionAggregate): RESTPrescription {
    return new RESTPrescription({
      id: val.aggregateId().unwrap(),
      patientId: val.patientId.unwrap(),
      medicationId: val.medicationId.unwrap(),
      address: val.address.unwrap(),
    });
  }
}
