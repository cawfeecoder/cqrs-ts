declare module "knex/lib/dialects/better-sqlite3" {
	import { Knex } from "knex";
	const client: typeof Knex.Client;
	export = client;
}

declare module "knex/lib/dialects/postgres" {
	import { Knex } from "knex";
	const client: typeof Knex.Client;
	export = client;
}

declare module "knex/lib/dialects/pgnative" {
	import { Knex } from "knex";
	const client: typeof Knex.Client;
	export = client;
}
