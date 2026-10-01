import vine from '@vinejs/vine'
import { OrderStatus } from '#enums/order_status'

const statuses = Object.values(OrderStatus)

export const createOrderValidator = vine.compile(
  vine.object({
    customerId: vine.number().withoutDecimals().positive(),
    items: vine
      .array(
        vine.object({
          productId: vine.number().withoutDecimals().positive(),
          quantity: vine.number().withoutDecimals().min(1),
        })
      )
      .minLength(1)
      .maxLength(100),
  })
)

export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(statuses),
  })
)

export const listOrdersValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().min(1).optional(),
    limit: vine.number().withoutDecimals().min(1).max(100).optional(),
    status: vine.enum(statuses).optional(),
    customerId: vine.number().withoutDecimals().positive().optional(),
    search: vine.string().trim().optional(),
  })
)
