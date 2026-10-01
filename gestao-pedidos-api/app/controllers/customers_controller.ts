import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import { toPage } from '#services/pagination'
import { likePattern } from '#services/search'
import {
  createCustomerValidator,
  listCustomersValidator,
  updateCustomerValidator,
} from '#validators/customer'

export default class CustomersController {
  async index({ request }: HttpContext) {
    const { page = 1, limit = 15, search } = await listCustomersValidator.validate(request.qs())

    const query = Customer.query().orderBy('name', 'asc')
    if (search) {
      query.where((group) => {
        group
          .whereRaw('LOWER(name) LIKE ?', [likePattern(search)])
          .orWhereRaw('phone LIKE ?', [`%${search}%`])
      })
    }

    return toPage(await query.paginate(page, limit))
  }

  async show({ params }: HttpContext) {
    return Customer.findOrFail(params.id)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createCustomerValidator)
    return response.created(await Customer.create(payload))
  }

  async update({ params, request }: HttpContext) {
    const customer = await Customer.findOrFail(params.id)
    const payload = await request.validateUsing(updateCustomerValidator)
    return customer.merge(payload).save()
  }
}
