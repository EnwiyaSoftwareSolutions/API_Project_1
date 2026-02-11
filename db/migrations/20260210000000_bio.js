exports.up = function(knex) {
  return knex.schema.createTable('bio', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('about').notNullable();
    table.string('education');
    table.string('experience');
    table.string('email');
    table.string('phone');
    table.string('photo_url');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('bio');
};
