/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async (knex) => {
  if (!(await knex.schema.hasTable("events"))) {
    await knex.schema.createTable("events", (table) => {
      table.text("aggregate_type").notNullable();
      table.text("aggregate_id").notNullable();
      table.text("sequence").notNullable();
      table.text("event_type").notNullable();
      table.text("event_version").notNullable();
      table.json("payload").notNullable();
      table.json("metadata");
      table.datetime("timestamp").notNullable().defaultTo(knex.fn.now());
    });
  }
  if (!(await knex.schema.hasTable("outbox_events"))) {
    await knex.schema.createTable("outbox_events", (table) => {
      table.text("aggregate_type").notNullable();
      table.text("aggregate_id").notNullable();
      table.text("sequence").notNullable();
      table.text("event_type").notNullable();
      table.text("event_version").notNullable();
      table.json("payload").notNullable();
      table.json("metadata");
      table.datetime("timestamp").notNullable().defaultTo(knex.fn.now());
      table.text("instance_id").nullable();
    });
  }
  if (!(await knex.schema.hasTable("snapshots"))) {
    await knex.schema.createTable("snapshots", (table) => {
      table.text("aggregate_type").notNullable();
      table.text("aggregate_id").notNullable();
      table.json("payload").notNullable();
      table.text("last_sequence").notNullable();
      table.text("snapshot_id").notNullable();
      table.datetime("timestamp").notNullable().defaultTo(knex.fn.now());
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async (knex) => {
  if (await knex.schema.hasTable("events")) {
    await knex.schema.dropTable("events");
  }
  if (await knex.schema.hasTable("outbox_events")) {
    await knex.schema.dropTable("outbox_events");
  }
  if (await knex.schema.hasTable("snapshots")) {
    await knex.schema.dropTable("snapshots");
  }
};
