import type { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import { toPage } from '#services/pagination'
import { likePattern } from '#services/search'
import {
  createProductValidator,
  listProductsValidator,
  updateProductActiveValidator,
  updateProductValidator,
} from '#validators/product'

export default class ProductsController {
  async index({ request }: HttpContext) {
    const {
      page = 1,
      limit = 15,
      search,
      active,
    } = await listProductsValidator.validate(request.qs())

    const query = Product.query().orderBy('name', 'asc')
    if (search) query.whereRaw('LOWER(name) LIKE ?', [likePattern(search)])
    if (active !== undefined) query.where('active', active)

    return toPage(await query.paginate(page, limit))
  }

  async show({ params }: HttpContext) {
    return Product.findOrFail(params.id)
  }

  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createProductValidator)
    const product = await Product.create({ ...payload, active: payload.active ?? true })
    return response.created(product)
  }

  async update({ params, request }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const payload = await request.validateUsing(updateProductValidator)
    return product.merge(payload).save()
  }

  
  async updateActive({ params, request }: HttpContext) {
    const product = await Product.findOrFail(params.id)
    const { active } = await request.validateUsing(updateProductActiveValidator)
    return product.merge({ active }).save()
  }
}
