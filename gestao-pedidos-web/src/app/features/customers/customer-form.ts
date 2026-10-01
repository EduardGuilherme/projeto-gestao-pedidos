import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomersService } from '../../core/services/customers.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-customer-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <header class="page-header">
      <h1>{{ id ? 'Editar cliente' : 'Novo cliente' }}</h1>
    </header>

    <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label class="field">
        <span>Nome</span>
        <input formControlName="name" maxlength="150" autocomplete="off" />
        @if (invalid('name')) { <small class="error">Informe um nome com pelo menos 2 caracteres.</small> }
      </label>

      <label class="field">
        <span>Telefone</span>
        <input formControlName="phone" inputmode="tel" placeholder="(13) 99111-0001" maxlength="20" autocomplete="off" />
        @if (invalid('phone')) { <small class="error">Informe um telefone válido (8 a 20 caracteres: números, +, -, parênteses).</small> }
      </label>

      <div class="form-actions">
        <a routerLink="/customers" class="btn">Cancelar</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Salvando…' : 'Salvar cliente' }}
        </button>
      </div>
    </form>
  `,
})
export class CustomerForm {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(CustomersService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    phone: ['', [Validators.required, Validators.pattern(/^\+?[0-9()\-\s]{8,20}$/)]],
  });

  constructor() {
    if (this.id) {
      this.api.get(this.id).subscribe((c) => this.form.patchValue({ name: c.name, phone: c.phone }));
    }
  }

  invalid(name: 'name' | 'phone') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, phone } = this.form.getRawValue();
    const payload = { name: name.trim(), phone: phone.trim() };

    this.saving.set(true);
    const request = this.id ? this.api.update(this.id, payload) : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.notify.success(this.id ? 'Cliente atualizado' : 'Cliente cadastrado');
        this.router.navigate(['/customers']);
      },
      error: () => this.saving.set(false),
    });
  }
}
