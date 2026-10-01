import { Component, inject } from '@angular/core';
import { NotificationService } from '../core/services/notification.service';

@Component({
  selector: 'app-toasts',
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of notify.toasts(); track t.id) {
        <div class="toast" [class.toast-error]="t.type === 'error'" role="status">
          <span>{{ t.message }}</span>
          <button type="button" class="toast-close" (click)="notify.dismiss(t.id)" aria-label="Fechar">×</button>
        </div>
      }
    </div>
  `,
})
export class Toasts {
  protected notify = inject(NotificationService);
}
