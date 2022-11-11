export enum PrescripionErrorTypes {
  MedicationNotExists = "MedicationNotExists",
  StateMachineTransitionFail = "StateTransitionFail",
  UnknownError = "UnknownError",
}

export class PrescriptionError extends Error {
  type: PrescripionErrorTypes;

  override message: string;

  public constructor(
    message: string,
    type: PrescripionErrorTypes = PrescripionErrorTypes.UnknownError
  ) {
    super(message);
    this.message = message;
    this.type = type;
  }
}
