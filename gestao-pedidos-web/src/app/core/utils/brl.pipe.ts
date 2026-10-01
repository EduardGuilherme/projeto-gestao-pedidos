import { Pipe, PipeTransform } from '@angular/core';
import { formatBrl } from './money';

@Pipe({ name: 'brl' })
export class BrlPipe implements PipeTransform {
  transform(cents: number | null | undefined): string {
    return formatBrl(cents ?? 0);
  }
}
