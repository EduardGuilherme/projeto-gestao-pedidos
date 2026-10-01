import { Component, computed, input } from '@angular/core';
import { ORDER_STATUS_LABELS, OrderStatus } from '../core/models';

@Component({
  selector: 'app-status-badge',
  template: `<span class="badge" [class]="'badge status-' + status()">{{ label() }}</span>`,
})
export class StatusBadge {
  status = input.required<OrderStatus>();
  label = computed(() => ORDER_STATUS_LABELS[this.status()]);
}
