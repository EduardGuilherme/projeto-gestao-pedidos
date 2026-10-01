import router from '@adonisjs/core/services/router'

const CustomersController = () => import('#controllers/customers_controller')
const ProductsController = () => import('#controllers/products_controller')
const OrdersController = () => import('#controllers/orders_controller')

router.get('/', async () => ({ name: 'Gestão de Pedidos API', status: 'ok' }))

router
  .group(() => {
    router.resource('customers', CustomersController).apiOnly().except(['destroy'])

    router.resource('products', ProductsController).apiOnly().except(['destroy'])
    router.patch('products/:id/active', [ProductsController, 'updateActive'])

    router.get('orders', [OrdersController, 'index'])
    router.get('orders/:id', [OrdersController, 'show'])
    router.post('orders', [OrdersController, 'store'])
    router.patch('orders/:id/status', [OrdersController, 'updateStatus'])
  })
  .prefix('/api')
