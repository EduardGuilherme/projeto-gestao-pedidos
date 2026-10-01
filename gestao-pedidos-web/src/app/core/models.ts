export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'finished' | 'canceled';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendente',
  preparing: 'Em preparação',
  ready: 'Pronto',
  finished: 'Finalizado',
  canceled: 'Cancelado',
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABELS) as OrderStatus[];

export interface Customer {
  id: number;
  name: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}


export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  total: number;
  product?: Product;
}


export interface Order {
  id: number;
  customerId: number;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt: string;
  allowedTransitions: OrderStatus[];
  customer?: Customer;
  items?: OrderItem[];
}

export interface PageMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
}

export interface Page<T> {
  data: T[];
  meta: PageMeta;
}

export interface CreateOrderPayload {
  customerId: number;
  items: { productId: number; quantity: number }[];
}
