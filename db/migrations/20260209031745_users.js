/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex, Promise) {
  return knex.schema.createTable("users", function (table) {
    table.increments("id").primary();
    table.string("username").notNullable();
    table.string("email").notNullable().unique();
    table.string("firstName").notNullable();
    table.string("lastName").notNullable();
    table.string("password").notNullable();
    table.string("dateOfBirth").notNullable();
    table.string("role").notNullable();
    table.string("bar_number");
    table.string("law_firm");
    table.string("specialization");
    table.text("bio_summary");
    table.timestamp("created_at").defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex, Promise) {
  return knex.schema.dropTable("users");
};
