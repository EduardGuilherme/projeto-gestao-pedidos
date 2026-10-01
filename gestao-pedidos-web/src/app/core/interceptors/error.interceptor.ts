import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';


export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notify = inject(NotificationService);

  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      notify.error(describeError(err));
      return throwError(() => err);
    }),
  );
};

function describeError(err: HttpErrorResponse): string {
  if (err.status === 0) {
    return 'Não foi possível conectar à API. Verifique se o servidor está rodando.';
  }
  const body = err.error;
  if (body?.code === 'E_VALIDATION_ERROR' && Array.isArray(body.errors)) {
    return body.errors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(' • ');
  }
  if (body?.message) return body.message;
  return err.status >= 500 ? 'Erro interno no servidor.' : 'Erro inesperado.';
}
