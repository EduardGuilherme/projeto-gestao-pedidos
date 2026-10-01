import { BaseSeeder } from '@adonisjs/lucid/seeders'
import app from '@adonisjs/core/services/app'
import Customer from '#models/customer'
import Product from '#models/product'
import Order from '#models/order'
import OrderService from '#services/order_service'
import { OrderStatus } from '#enums/order_status'

export default class MainSeeder extends BaseSeeder {
  async run() {
    const [maria, joao] = await Customer.updateOrCreateMany('phone', [
      { name: 'Maria Silva', phone: '13991110001' },
      { name: 'João Souza', phone: '13991110002' },
      { name: 'Ana Costa', phone: '13991110003' },
    ])

    const [burger, fries, soda] = await Product.updateOrCreateMany('name', [
      { name: 'X-Burger', price: 2500, active: true },
      { name: 'Batata Frita', price: 1800, active: true },
      { name: 'Refrigerante', price: 600, active: true },
      { name: 'Milkshake (descontinuado)', price: 1500, active: false },
    ])

    if (await Order.query().first()) return

    const orders = await app.container.make(OrderService)

    await orders.create({
      customerId: maria.id,
      items: [
        { productId: burger.id, quantity: 2 },
        { productId: soda.id, quantity: 2 },
      ],
    })

    const second = await orders.create({
      customerId: joao.id,
      items: [
        { productId: burger.id, quantity: 1 },
        { productId: fries.id, quantity: 1 },
      ],
    })
    await orders.changeStatus(second.id, OrderStatus.PREPARING)
  }
}
