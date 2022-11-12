export type CreatePrescriptionInput = {
  address: string;
  medicationId: string;
  patientId: string;
};

import { PrescriptionAggregate } from "@prescription/domain/entity/aggregate";
import { From, staticImplements } from "@common/domain/entity/traits";

@staticImplements<From<PrescriptionAggregate, GraphQLPrescription>>()
export class GraphQLPrescription {
  id: string;
  patientId: string;
  medicationId: string;
  // Note: We can specifically have fields available in our 'core' aggregate type
  // that we don't expose via an interface (e.g. GraphQL)
  // address: string;

  public constructor({
    id,
    patientId,
    medicationId,
  }: // address,
  {
    id: string;
    patientId: string;
    medicationId: string;
    // address: string;
  }) {
    this.id = id;
    this.patientId = patientId;
    this.medicationId = medicationId;
  }

  public static from(val: PrescriptionAggregate): GraphQLPrescription {
    return new GraphQLPrescription({
      id: val.aggregateId().unwrap(),
      patientId: val.patientId.unwrap(),
      medicationId: val.medicationId.unwrap(),
    });
  }
}
