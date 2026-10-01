import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('customer_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('customers')
        .onDelete('RESTRICT')
      table.string('status', 20).notNullable().defaultTo('pending')
      table.integer('total').unsigned().notNullable().defaultTo(0) // centavos
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').notNullable()

      table.index(['status'])
      table.index(['customer_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
