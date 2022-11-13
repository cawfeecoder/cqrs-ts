import {
	EventEnvelope,
	From,
	staticImplements,
	To,
} from "@common/domain/entity";
import { PrescriptionAggregateEventEnvlope } from "@prescription/domain/entity/aggregate";
import {
	PrescriptionCreatedEvent,
	PrescriptionEvent,
} from "@prescription/domain/entity/event";
import { None, Option, Some } from "@sniptt/monads/build";
import { CloudEvent } from "cloudevents";

@staticImplements<
  From<PrescriptionAggregateEventEnvlope, Option<PrescriptionCloudEvent>>
>()
export class PrescriptionCloudEvent
	extends CloudEvent<Omit<PrescriptionEvent, "eventId">>
	implements To<Option<PrescriptionAggregateEventEnvlope>>
{
	public constructor({
		id,
		source,
		type,
		subject,
		time,
		data,
	}: {
		id: string;
		source: string;
		type: string;
		subject: string;
		time: Date | string;
		data: Omit<PrescriptionEvent, "eventId">;
	}) {
		super({
			id: id,
			specversion: "1.0",
			source: source,
			type: type,
			datacontenttype: "application/json",
			subject: subject,
			time: typeof time === "string" ? time : time.toISOString(),
			data: data,
		});
	}

	public static from(
		val: EventEnvelope<PrescriptionEvent>,
	): Option<PrescriptionCloudEvent> {
		let ce: Option<PrescriptionCloudEvent> = None;
		switch (val.payload.eventType()) {
			case "PrescriptionCreated": {
				let event = Object.assign({}, val.payload as PrescriptionCreatedEvent);
				(val.payload as Record<string, any>).eventId = undefined;
				ce = Some(
					new PrescriptionCloudEvent({
						id: event.eventId,
						// TODO: Change this to an organization/user when you have authentication
						source: "system",
						type: "system:prescription:created",
						subject: event.id,
						time: val.timestamp,
						data: val.payload,
					}),
				);
				break;
			}
		}
		return ce;
	}

	public to(): Option<PrescriptionAggregateEventEnvlope> {
		let event: Option<PrescriptionAggregateEventEnvlope> = None;

		switch (this.type) {
			case "system:prescription:created": {
				event = Some(
					new PrescriptionAggregateEventEnvlope({
						aggregateId: this.subject!,
						aggregateType: "prescription",
						sequence: this.id,
						payload: Object.assign(this.data as PrescriptionCreatedEvent, {
							eventId: this.id,
						}),
						metadata: {},
						timestamp: new Date(this.time!),
					}),
				);
				break;
			}
		}

		return event;
	}
}
