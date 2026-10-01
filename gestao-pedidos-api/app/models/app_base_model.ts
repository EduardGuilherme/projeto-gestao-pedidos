import { BaseModel, SnakeCaseNamingStrategy } from '@adonisjs/lucid/orm'


class ApiNamingStrategy extends SnakeCaseNamingStrategy {
  serializedName(_model: typeof BaseModel, propertyName: string) {
    return propertyName
  }
}

export default class AppBaseModel extends BaseModel {
  static namingStrategy = new ApiNamingStrategy()
}
