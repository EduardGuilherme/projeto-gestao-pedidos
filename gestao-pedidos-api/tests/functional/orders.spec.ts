import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Customer from '#models/customer'
import Product from '#models/product'

async function seed() {
  const customer = await Customer.create({ name: 'Maria Silva', phone: '13991110001' })
  const burger = await Product.create({ name: 'X-Burger', price: 2500, active: true })
  const soda = await Product.create({ name: 'Refrigerante', price: 600, active: true })
  const inactive = await Product.create({ name: 'Descontinuado', price: 1000, active: false })
  return { customer, burger, soda, inactive }
}

test.group('Orders › criação', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cria pedido com total calculado pelo backend (ignora total enviado)', async ({
    client,
    assert,
  }) => {
    const { customer, burger, soda } = await seed()

    const response = await client.post('/api/orders').json({
      customerId: customer.id,
      total: 1, // deve ser ignorado
      items: [
        { productId: burger.id, quantity: 2 },
        { productId: soda.id, quantity: 1 },
      ],
    })

    response.assertStatus(201)
    const body = response.body()
    assert.equal(body.status, 'pending')
    assert.equal(body.total, 5600)
    assert.lengthOf(body.items, 2)
    assert.equal(body.customer.name, 'Maria Silva')

    const burgerItem = body.items.find((i: any) => i.productId === burger.id)
    assert.equal(burgerItem.quantity, 2)
    assert.equal(burgerItem.unitPrice, 2500)
    assert.equal(burgerItem.total, 5000)
    assert.equal(burgerItem.product.name, 'X-Burger')
    assert.deepEqual(body.allowedTransitions, ['preparing', 'canceled'])
  })

  test('soma quantidades quando o mesmo produto é repetido', async ({ client, assert }) => {
    const { customer, burger } = await seed()

    const response = await client.post('/api/orders').json({
      customerId: customer.id,
      items: [
        { productId: burger.id, quantity: 1 },
        { productId: burger.id, quantity: 2 },
      ],
    })

    response.assertStatus(201)
    assert.lengthOf(response.body().items, 1)
    assert.equal(response.body().items[0].quantity, 3)
    assert.equal(response.body().total, 7500)
  })

  test('preço do item é preservado quando o produto muda de preço', async ({ client, assert }) => {
    const { customer, burger } = await seed()

    const created = await client
      .post('/api/orders')
      .json({ customerId: customer.id, items: [{ productId: burger.id, quantity: 2 }] })
    const orderId = created.body().id

    burger.price = 3000
    await burger.save()

    const old = await client.get(`/api/orders/${orderId}`)
    assert.equal(old.body().items[0].unitPrice, 2500)
    assert.equal(old.body().items[0].total, 5000)
    assert.equal(old.body().total, 5000)

    const fresh = await client
      .post('/api/orders')
      .json({ customerId: customer.id, items: [{ productId: burger.id, quantity: 2 }] })
    assert.equal(fresh.body().items[0].unitPrice, 3000)
    assert.equal(fresh.body().total, 6000)
  })

  test('exige cliente', async ({ client }) => {
    const { burger } = await seed()
    const response = await client
      .post('/api/orders')
      .json({ items: [{ productId: burger.id, quantity: 1 }] })
    response.assertStatus(422)
    response.assertBodyContains({ code: 'E_VALIDATION_ERROR' })
  })

  test('exige ao menos um item', async ({ client }) => {
    const { customer } = await seed()
    ;(await client.post('/api/orders').json({ customerId: customer.id, items: [] })).assertStatus(422)
    ;(await client.post('/api/orders').json({ customerId: customer.id })).assertStatus(422)
  })

  test('quantidade mínima é 1', async ({ client }) => {
    const { customer, burger } = await seed()
    for (const quantity of [0, -2, 1.5]) {
      const response = await client
        .post('/api/orders')
        .json({ customerId: customer.id, items: [{ productId: burger.id, quantity }] })
      response.assertStatus(422)
    }
  })

  test('não aceita produto inativo', async ({ client, assert }) => {
    const { customer, burger, inactive } = await seed()
    const response = await client.post('/api/orders').json({
      customerId: customer.id,
      items: [
        { productId: burger.id, quantity: 1 },
        { productId: inactive.id, quantity: 1 },
      ],
    })
    response.assertStatus(422)
    assert.equal(response.body().code, 'E_INACTIVE_PRODUCT')
  })

  test('rejeita cliente e produto inexistentes', async ({ client, assert }) => {
    const { customer, burger } = await seed()

    const noCustomer = await client
      .post('/api/orders')
      .json({ customerId: 9999, items: [{ productId: burger.id, quantity: 1 }] })
    noCustomer.assertStatus(422)
    assert.equal(noCustomer.body().code, 'E_CUSTOMER_NOT_FOUND')

    const noProduct = await client
      .post('/api/orders')
      .json({ customerId: customer.id, items: [{ productId: 9999, quantity: 1 }] })
    noProduct.assertStatus(422)
    assert.equal(noProduct.body().code, 'E_PRODUCT_NOT_FOUND')
  })

  test('pedido rejeitado não deixa registros para trás (transaction)', async ({
    client,
    assert,
  }) => {
    const { customer, burger, inactive } = await seed()
    await client.post('/api/orders').json({
      customerId: customer.id,
      items: [
        { productId: burger.id, quantity: 1 },
        { productId: inactive.id, quantity: 1 },
      ],
    })
    const list = await client.get('/api/orders')
    assert.equal(list.body().meta.total, 0)
  })

  test('retorna 404 para pedido inexistente', async ({ client }) => {
    ;(await client.get('/api/orders/999')).assertStatus(404)
  })
})

test.group('Orders › status', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  async function createOrder(client: any) {
    const { customer, burger } = await seed()
    const response = await client
      .post('/api/orders')
      .json({ customerId: customer.id, items: [{ productId: burger.id, quantity: 1 }] })
    return response.body().id as number
  }

  const setStatus = (client: any, id: number, status: string) =>
    client.patch(`/api/orders/${id}/status`).json({ status })

  test('percorre o fluxo completo até finalizado', async ({ client, assert }) => {
    const id = await createOrder(client)

    for (const status of ['preparing', 'ready', 'finished']) {
      const response = await setStatus(client, id, status)
      response.assertStatus(200)
      assert.equal(response.body().status, status)
    }
  })

  test('não permite pular etapas nem voltar', async ({ client, assert }) => {
    const id = await createOrder(client)

    const skip = await setStatus(client, id, 'ready')
    skip.assertStatus(422)
    assert.equal(skip.body().code, 'E_INVALID_STATUS_TRANSITION')

    await setStatus(client, id, 'preparing')
    ;(await setStatus(client, id, 'pending')).assertStatus(422)
    ;(await setStatus(client, id, 'preparing')).assertStatus(422)
  })

  test('permite cancelar a partir de pendente, em preparação e pronto', async ({
    client,
    assert,
  }) => {
    for (const path of [[], ['preparing'], ['preparing', 'ready']]) {
      const id = await createOrder(client)
      for (const status of path) await setStatus(client, id, status)

      const response = await setStatus(client, id, 'canceled')
      response.assertStatus(200)
      assert.equal(response.body().status, 'canceled')
      assert.deepEqual(response.body().allowedTransitions, [])

    }
  })

  test('pedido cancelado não volta para nenhum outro status', async ({ client }) => {
    const id = await createOrder(client)
    await setStatus(client, id, 'canceled')

    for (const status of ['pending', 'preparing', 'ready', 'finished', 'canceled']) {
      ;(await setStatus(client, id, status)).assertStatus(422)
    }
  })

  test('pedido finalizado não pode ser cancelado', async ({ client }) => {
    const id = await createOrder(client)
    for (const status of ['preparing', 'ready', 'finished']) await setStatus(client, id, status)
    ;(await setStatus(client, id, 'canceled')).assertStatus(422)
  })

  test('valida o status informado e a existência do pedido', async ({ client }) => {
    const id = await createOrder(client)
    ;(await setStatus(client, id, 'qualquer')).assertStatus(422)
    ;(await setStatus(client, 9999, 'preparing')).assertStatus(404)
  })
})

test.group('Orders › listagem', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('lista com paginação, filtro por status, cliente e busca', async ({ client, assert }) => {
    const { customer, burger } = await seed()
    const other = await Customer.create({ name: 'João Souza', phone: '13991110002' })

    const make = async (customerId: number) =>
      (
        await client
          .post('/api/orders')
          .json({ customerId, items: [{ productId: burger.id, quantity: 1 }] })
      ).body().id as number

    const first = await make(customer.id)
    await make(customer.id)
    await make(other.id)
    await client.patch(`/api/orders/${first}/status`).json({ status: 'preparing' })

    const all = await client.get('/api/orders').qs({ limit: 2 })
    assert.lengthOf(all.body().data, 2)
    assert.equal(all.body().meta.total, 3)
    assert.equal(all.body().meta.lastPage, 2)
    assert.isAbove(all.body().data[0].id, all.body().data[1].id) // mais recentes primeiro
    assert.exists(all.body().data[0].customer.name)

    const byStatus = await client.get('/api/orders').qs({ status: 'preparing' })
    assert.deepEqual(byStatus.body().data.map((o: any) => o.id), [first])

    const byCustomer = await client.get('/api/orders').qs({ customerId: other.id })
    assert.equal(byCustomer.body().meta.total, 1)

    const byName = await client.get('/api/orders').qs({ search: 'joão' })
    assert.equal(byName.body().meta.total, 1)

    const byId = await client.get('/api/orders').qs({ search: String(first) })
    assert.equal(byId.body().data[0].id, first)

    ;(await client.get('/api/orders').qs({ status: 'xyz' })).assertStatus(422)
  })
})
