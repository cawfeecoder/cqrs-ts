import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import { ApplicationLogger } from "@common/utils/logger";
import { CreatePrescriptionUseCase } from "@prescription/application/ports/inbound/createPrescription";
import { CreatePrescriptionCommand } from "@prescription/domain/entity/command";
import { Err, Ok, Result } from "@sniptt/monads/build";
import { gql } from "graphql-tag";
import { GraphQLError } from "graphql";
import {
	CreatePrescriptionInput,
	GraphQLPrescription,
} from "@prescription/infrastructure/dtos/graphql";

const typeDefs = gql`
  type Prescription {
    id: String!
    patientId: String!
    medicationId: String!
  }

  input CreatePrescriptionInput {
    address: String!
    medicationId: String!
    patientId: String!
  }

  type Mutation {
    createPrescription(input: CreatePrescriptionInput!): Prescription!
  }

  type Query {
    getPrescriptionCommandServiceVersion: String!
  }
`;

export class GraphQLPrescriptionAdapter {
	private service: CreatePrescriptionUseCase<GraphQLPrescription>;
	private app;
	private logger;

	public constructor(
		service: CreatePrescriptionUseCase<GraphQLPrescription>,
		version: string = "0.0.1",
	) {
		this.service = service;
		this.logger = ApplicationLogger.getInstance().getLogger();

		const resolvers = {
			Query: {
				getPrescriptionCommandServiceVersion: () => version,
			},
			Mutation: {
				createPrescription: async (
					_: any,
					{ input }: {
						input: CreatePrescriptionInput;
					},
				) => {
					let command = new CreatePrescriptionCommand({
						medicationId: input.medicationId,
						patientId: input.patientId,
						address: input.address,
					});
					let result = await this.service.createPrescription(
						command,
						(aggregate) => GraphQLPrescription.from(aggregate),
					);
					if (result.isErr()) {
						this.logger.error(result.unwrapErr().message);
						throw new GraphQLError("Failed to create new prescription", {
							extensions: {
								code: "INTERNAL_SERVER_ERROR",
							},
						});
					}
					return result.unwrap();
				},
			},
		};

		this.app = new ApolloServer({
			typeDefs,
			resolvers,
		});
	}

	public async run(...args: any[]): Promise<Result<undefined, Error>> {
		try {
			const { url } = await startStandaloneServer(this.app);
			this.logger.info("Prescription GraphQL service started", {
				address: url,
			});
			return Ok(undefined);
		} catch (e) {
			return Err(e as Error);
		}
	}
}
