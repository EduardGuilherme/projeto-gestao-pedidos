import vine from '@vinejs/vine'

const name = () => vine.string().trim().minLength(2).maxLength(150)
const phone = () =>
  vine
    .string()
    .trim()
    .regex(/^\+?[0-9()\-\s]{8,20}$/)

export const createCustomerValidator = vine.compile(
  vine.object({
    name: name(),
    phone: phone(),
  })
)

export const updateCustomerValidator = vine.compile(
  vine.object({
    name: name().optional(),
    phone: phone().optional(),
  })
)

export const listCustomersValidator = vine.compile(
  vine.object({
    page: vine.number().withoutDecimals().min(1).optional(),
    limit: vine.number().withoutDecimals().min(1).max(100).optional(),
    search: vine.string().trim().optional(),
  })
)
