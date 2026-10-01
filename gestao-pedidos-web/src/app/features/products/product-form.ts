import { Component, inject, signal } from '@angular/core';
import { AbstractControl, NonNullableFormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '../../core/services/notification.service';
import { ProductsService } from '../../core/services/products.service';
import { centsToInput, parseBrlToCents } from '../../core/utils/money';

function priceValidator(control: AbstractControl): ValidationErrors | null {
  const cents = parseBrlToCents(control.value);
  return cents !== null && cents > 0 ? null : { price: true };
}

@Component({
  selector: 'app-product-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <header class="page-header">
      <h1>{{ id ? 'Editar produto' : 'Novo produto' }}</h1>
    </header>

    <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <label class="field">
        <span>Nome</span>
        <input formControlName="name" maxlength="150" autocomplete="off" />
        @if (invalid('name')) { <small class="error">Informe um nome com pelo menos 2 caracteres.</small> }
      </label>

      <label class="field">
        <span>Preço (R$)</span>
        <input formControlName="price" inputmode="decimal" placeholder="25,00" autocomplete="off" />
        @if (invalid('price')) { <small class="error">Informe um valor maior que zero, com até 2 casas decimais (ex.: 25,00).</small> }
      </label>

      <label class="check">
        <input type="checkbox" formControlName="active" />
        <span>Produto ativo (disponível para novos pedidos)</span>
      </label>

      <div class="form-actions">
        <a routerLink="/products" class="btn">Cancelar</a>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ saving() ? 'Salvando…' : 'Salvar produto' }}
        </button>
      </div>
    </form>
  `,
})
export class ProductForm {
  private fb = inject(NonNullableFormBuilder);
  private api = inject(ProductsService);
  private notify = inject(NotificationService);
  private router = inject(Router);

  id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || null;
  saving = signal(false);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    price: ['', [Validators.required, priceValidator]],
    active: [true],
  });

  constructor() {
    if (this.id) {
      this.api.get(this.id).subscribe((p) =>
        this.form.patchValue({ name: p.name, price: centsToInput(p.price), active: p.active }),
      );
    }
  }

  invalid(name: 'name' | 'price') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { name, price, active } = this.form.getRawValue();
    const payload = { name: name.trim(), price: parseBrlToCents(price)!, active };

    this.saving.set(true);
    const request = this.id ? this.api.update(this.id, payload) : this.api.create(payload);
    request.subscribe({
      next: () => {
        this.notify.success(this.id ? 'Produto atualizado' : 'Produto cadastrado');
        this.router.navigate(['/products']);
      },
      error: () => this.saving.set(false),
    });
  }
}
