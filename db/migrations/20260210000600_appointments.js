exports.up = function(knex) {
  return knex.schema.createTable('appointments', function(table) {
    table.increments('id').primary();
    table.integer('lawyer_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('SET NULL');
    table.datetime('appointment_time').notNullable();
    table.string('status');
    table.text('notes');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('appointments');
};
