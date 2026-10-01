import db from '@adonisjs/lucid/services/db'
import Customer from '#models/customer'
import Product from '#models/product'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import { likePattern } from '#services/search'
import BusinessRuleException from '#exceptions/business_rule_exception'
import { OrderStatus, ORDER_STATUS_LABELS, canTransition } from '#enums/order_status'

export type CreateOrderInput = {
  customerId: number
  items: { productId: number; quantity: number }[]
}

export type ListOrdersFilters = {
  page?: number
  limit?: number
  status?: OrderStatus
  customerId?: number
  search?: string
}

export default class OrderService {
  async list({ page = 1, limit = 15, status, customerId, search }: ListOrdersFilters) {
    const query = Order.query().preload('customer').orderBy('id', 'desc')

    if (status) query.where('status', status)
    if (customerId) query.where('customer_id', customerId)

    if (search) {
      query.where((group) => {
        if (/^\d+$/.test(search)) group.where('id', Number(search))
        group.orWhereHas('customer', (customer) =>
          customer.whereRaw('LOWER(customers.name) LIKE ?', [likePattern(search)])
        )
      })
    }

    return query.paginate(page, limit)
  }

  async find(id: number) {
    return Order.query()
      .where('id', id)
      .preload('customer')
      .preload('items', (items) => items.preload('product').orderBy('id', 'asc'))
      .firstOrFail()
  }


  async create({ customerId, items }: CreateOrderInput) {
    const orderId = await db.transaction(async (trx) => {
      const customer = await Customer.query({ client: trx }).where('id', customerId).first()
      if (!customer) {
        throw new BusinessRuleException('Cliente não encontrado', {
          code: 'E_CUSTOMER_NOT_FOUND',
        })
      }

      
      const quantities = new Map<number, number>()
      for (const item of items) {
        quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity)
      }

      const products = await Product.query({ client: trx }).whereIn('id', [...quantities.keys()])
      const productsById = new Map(products.map((product) => [product.id, product]))

      const missing = [...quantities.keys()].filter((id) => !productsById.has(id))
      if (missing.length) {
        throw new BusinessRuleException(`Produtos não encontrados: ${missing.join(', ')}`, {
          code: 'E_PRODUCT_NOT_FOUND',
        })
      }

      const inactive = products.filter((product) => !product.active)
      if (inactive.length) {
        throw new BusinessRuleException(
          `Produtos inativos não podem ser adicionados ao pedido: ${inactive
            .map((product) => product.name)
            .join(', ')}`,
          { code: 'E_INACTIVE_PRODUCT' }
        )
      }

      const lines = [...quantities.entries()].map(([productId, quantity]) => {
        const unitPrice = productsById.get(productId)!.price
        return { productId, quantity, unitPrice, total: unitPrice * quantity }
      })

      const order = await Order.create(
        {
          customerId,
          status: OrderStatus.PENDING,
          total: lines.reduce((sum, line) => sum + line.total, 0),
        },
        { client: trx }
      )

      await OrderItem.createMany(
        lines.map((line) => ({ ...line, orderId: order.id })),
        { client: trx }
      )

      return order.id
    })

    return this.find(orderId)
  }


  async changeStatus(id: number, next: OrderStatus) {
    const order = await Order.findOrFail(id)

    if (!canTransition(order.status, next)) {
      throw new BusinessRuleException(
        `Não é possível alterar o pedido de "${ORDER_STATUS_LABELS[order.status]}" para "${ORDER_STATUS_LABELS[next]}"`,
        { code: 'E_INVALID_STATUS_TRANSITION' }
      )
    }

    order.status = next
    await order.save()

    return this.find(order.id)
  }
}
