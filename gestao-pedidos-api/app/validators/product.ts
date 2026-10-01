import vine from '@vinejs/vine'


const price = () => vine.number().withoutDecimals().positive()
const name = () => vine.string().trim().minLength(2).maxLength(150)

export const createProductValidator = vine.compile(
  vine.object({
    name: name(),
    price: price(),
    active: vine.boolean().optional(),
  })
)

export const updateProductValidator = vine.compile(
  vine.object({
    name: name().optional(),
    price: price().optional(),
    active: vine.boolean().optional(),
  })
)

export const updateProductActiveValidator = vine.compile(
  vine.object({
    active: vine.boolean(),
  })
)

export const listProductsValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().min(1).optional(),
    limit: vine.number().withoutDecimals().min(1).max(100).optional(),
    search: vine.string().trim().optional(),
    active: vine.boolean().optional(),
  })
)
