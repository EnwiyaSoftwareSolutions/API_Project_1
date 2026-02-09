/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("Client_Review").del();
  await knex("Client_Review").insert([
    { $id: 1, reviewer_name: "rowValue1" },
    { $id: 2, reviewer_name: "rowValue2" },
    { id: 3, reviewer_name: "rowValue3" },
  ]);
};
