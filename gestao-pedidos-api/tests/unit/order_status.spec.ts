import { test } from '@japa/runner'
import { OrderStatus, availableTransitions, canTransition } from '#enums/order_status'

test.group('OrderStatus state machine', () => {
  test('segue o fluxo Pendente → Em preparação → Pronto → Finalizado', ({ assert }) => {
    assert.isTrue(canTransition(OrderStatus.PENDING, OrderStatus.PREPARING))
    assert.isTrue(canTransition(OrderStatus.PREPARING, OrderStatus.READY))
    assert.isTrue(canTransition(OrderStatus.READY, OrderStatus.FINISHED))
  })

  test('não permite pular etapas nem voltar', ({ assert }) => {
    assert.isFalse(canTransition(OrderStatus.PENDING, OrderStatus.READY))
    assert.isFalse(canTransition(OrderStatus.READY, OrderStatus.PENDING))
    assert.isFalse(canTransition(OrderStatus.PENDING, OrderStatus.PENDING))
  })

  test('cancelado e finalizado são estados terminais', ({ assert }) => {
    assert.deepEqual(availableTransitions(OrderStatus.CANCELED), [])
    assert.deepEqual(availableTransitions(OrderStatus.FINISHED), [])
  })
})
