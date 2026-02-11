exports.up = function(knex) {
  return knex.schema.createTable('degree', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('education_id').unsigned().references('id').inTable('education').onDelete('CASCADE');
    table.string('title').notNullable();
    table.string('field');
    table.string('level');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('degree');
};
