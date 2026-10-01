import { DateTime } from 'luxon'
import { belongsTo, column, computed, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import AppBaseModel from '#models/app_base_model'
import Customer from '#models/customer'
import OrderItem from '#models/order_item'
import { OrderStatus, availableTransitions } from '#enums/order_status'

export default class Order extends AppBaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare customerId: number

  @column()
  declare status: OrderStatus

  
  @column()
  declare total: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => Customer)
  declare customer: BelongsTo<typeof Customer>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  
  @computed()
  get allowedTransitions(): OrderStatus[] {
    return availableTransitions(this.status)
  }
}
