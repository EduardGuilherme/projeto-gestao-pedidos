import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import OrderService from '#services/order_service'
import { toPage } from '#services/pagination'
import {
  createOrderValidator,
  listOrdersValidator,
  updateOrderStatusValidator,
} from '#validators/order'

@inject()
export default class OrdersController {
  constructor(private orders: OrderService) {}

  async index({ request }: HttpContext) {
    const filters = await listOrdersValidator.validate(request.qs())
    return toPage(await this.orders.list(filters))
  }

  async show({ params }: HttpContext) {
    return this.orders.find(params.id)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createOrderValidator)
    return response.created(await this.orders.create(payload))
  }

  async updateStatus({ params, request }: HttpContext) {
    const { status } = await request.validateUsing(updateOrderStatusValidator)
    return this.orders.changeStatus(params.id, status)
  }
}
