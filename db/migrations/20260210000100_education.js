exports.up = function(knex) {
  return knex.schema.createTable('education', function(table) {
    table.increments('id').primary();
    table.integer('bio_id').unsigned().references('id').inTable('bio').onDelete('CASCADE');
    table.string('degree').notNullable();
    table.string('institution').notNullable();
    table.string('year');
    table.text('description');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('education');
};
