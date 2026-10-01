import { Exception } from '@adonisjs/core/exceptions'


export default class BusinessRuleException extends Exception {
  static status = 422
  static code = 'E_BUSINESS_RULE'
}
