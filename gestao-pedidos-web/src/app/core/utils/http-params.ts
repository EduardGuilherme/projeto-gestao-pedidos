import { HttpParams } from '@angular/common/http';

export function buildParams(values: Record<string, string | number | boolean | null | undefined>) {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
