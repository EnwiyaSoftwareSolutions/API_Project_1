/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex, Promise) {
  return knex.schema.createTable("reviews", function (table) {
    table.increments("id").primary();
    table.string("reviewer_name").notNullable();
    table.string("reviewer_email");
    table.integer("rating").notNullable();
    table.text("comment").notNullable();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE"); // lawyer being reviewed
    table.integer("client_id").unsigned().references("id").inTable("clients").onDelete("SET NULL");
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex, Promise) {
  return knex.schema.dropTable("reviews");
};
