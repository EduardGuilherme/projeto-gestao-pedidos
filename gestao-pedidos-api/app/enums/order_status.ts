export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  FINISHED = 'finished',
  CANCELED = 'canceled',
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Pendente',
  [OrderStatus.PREPARING]: 'Em preparação',
  [OrderStatus.READY]: 'Pronto',
  [OrderStatus.FINISHED]: 'Finalizado',
  [OrderStatus.CANCELED]: 'Cancelado',
}


export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELED],
  [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELED],
  [OrderStatus.READY]: [OrderStatus.FINISHED, OrderStatus.CANCELED],
  [OrderStatus.FINISHED]: [],
  [OrderStatus.CANCELED]: [],
}

export function availableTransitions(status: OrderStatus): OrderStatus[] {
  return ORDER_TRANSITIONS[status] ?? []
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return availableTransitions(from).includes(to)
}
