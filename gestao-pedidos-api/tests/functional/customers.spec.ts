import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Customers', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('cadastra, edita e lista clientes', async ({ client, assert }) => {
    const created = await client.post('/api/customers').json({ name: 'Maria Silva', phone: '13991110001' })
    created.assertStatus(201)

    const id = created.body().id
    const updated = await client.put(`/api/customers/${id}`).json({ phone: '13988887777' })
    updated.assertStatus(200)
    assert.equal(updated.body().phone, '13988887777')
    assert.equal(updated.body().name, 'Maria Silva')

    const list = await client.get('/api/customers').qs({ search: 'maria' })
    list.assertStatus(200)
    assert.lengthOf(list.body().data, 1)
    assert.equal(list.body().meta.total, 1)
  })

  test('valida nome e telefone', async ({ client, assert }) => {
    const response = await client.post('/api/customers').json({ name: 'A', phone: 'abc' })
    response.assertStatus(422)
    assert.equal(response.body().code, 'E_VALIDATION_ERROR')
    assert.lengthOf(response.body().errors, 2)
  })

  test('retorna 404 para cliente inexistente', async ({ client }) => {
    const response = await client.get('/api/customers/999')
    response.assertStatus(404)
    response.assertBodyContains({ code: 'E_NOT_FOUND' })
  })
})
