import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import Product from '#models/product'

test.group('Products', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cadastra produto ativo por padrão (preço em centavos)', async ({ client, assert }) => {
    const response = await client.post('/api/products').json({ name: 'X-Burger', price: 2500 })
    response.assertStatus(201)
    assert.equal(response.body().price, 2500)
    assert.isTrue(response.body().active)
  })

  test('rejeita preço inválido', async ({ client }) => {
    ;(await client.post('/api/products').json({ name: 'X', price: 0 })).assertStatus(422)
    ;(await client.post('/api/products').json({ name: 'X-Burger', price: 10.5 })).assertStatus(422)
    ;(await client.post('/api/products').json({ name: 'X-Burger', price: -1 })).assertStatus(422)
  })

  test('edita produto', async ({ client, assert }) => {
    const product = await Product.create({ name: 'X-Burger', price: 2500, active: true })
    const response = await client.put(`/api/products/${product.id}`).json({ price: 3000 })
    response.assertStatus(200)
    assert.equal(response.body().price, 3000)
  })

  test('ativa e desativa produto', async ({ client, assert }) => {
    const product = await Product.create({ name: 'X-Burger', price: 2500, active: true })

    const off = await client.patch(`/api/products/${product.id}/active`).json({ active: false })
    off.assertStatus(200)
    assert.isFalse(off.body().active)

    const on = await client.patch(`/api/products/${product.id}/active`).json({ active: true })
    assert.isTrue(on.body().active)
  })

  test('filtra por ativo e por nome', async ({ client, assert }) => {
    await Product.createMany([
      { name: 'X-Burger', price: 2500, active: true },
      { name: 'X-Salada', price: 2200, active: false },
      { name: 'Refrigerante', price: 600, active: true },
    ])

    const active = await client.get('/api/products').qs({ active: true })
    assert.lengthOf(active.body().data, 2)

    const search = await client.get('/api/products').qs({ search: 'x-' })
    assert.lengthOf(search.body().data, 2)
  })
})
