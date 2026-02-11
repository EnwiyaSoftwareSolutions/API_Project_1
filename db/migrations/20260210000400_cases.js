exports.up = function(knex) {
  return knex.schema.createTable('cases', function(table) {
    table.increments('id').primary();
    table.string('title').notNullable();
    table.text('description');
    table.integer('lawyer_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('client_id').unsigned().references('id').inTable('clients').onDelete('SET NULL');
    table.string('status');
    table.date('opened_at');
    table.date('closed_at');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('cases');
};
