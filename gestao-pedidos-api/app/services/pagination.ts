import type { LucidRow, ModelPaginatorContract } from '@adonisjs/lucid/types/model'


export function toPage<T extends LucidRow>(paginator: ModelPaginatorContract<T>) {
  return {
    data: paginator.all(),
    meta: {
      total: paginator.total,
      perPage: paginator.perPage,
      currentPage: paginator.currentPage,
      lastPage: paginator.lastPage,
    },
  }
}
