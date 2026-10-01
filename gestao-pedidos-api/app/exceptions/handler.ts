import app from '@adonisjs/core/services/app'
import { HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import { errors as vineErrors } from '@vinejs/vine'
import { errors as lucidErrors } from '@adonisjs/lucid'
import BusinessRuleException from '#exceptions/business_rule_exception'


export default class HttpExceptionHandler extends ExceptionHandler {
  protected debug = !app.inProduction

  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof vineErrors.E_VALIDATION_ERROR) {
      return ctx.response.status(422).send({
        code: 'E_VALIDATION_ERROR',
        message: 'Dados inválidos',
        errors: error.messages,
      })
    }

    if (error instanceof lucidErrors.E_ROW_NOT_FOUND) {
      return ctx.response.status(404).send({
        code: 'E_NOT_FOUND',
        message: 'Registro não encontrado',
      })
    }

    if (error instanceof BusinessRuleException) {
      return ctx.response.status(error.status).send({
        code: error.code,
        message: error.message,
      })
    }

    return super.handle(error, ctx)
  }

  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
