import { describe, expect, it } from 'vitest';
import { centsToInput, parseBrlToCents } from './money';

describe('money utils', () => {
  it('converte reais em centavos', () => {
    expect(parseBrlToCents('25')).toBe(2500);
    expect(parseBrlToCents('25,00')).toBe(2500);
    expect(parseBrlToCents('25.5')).toBe(2550);
    expect(parseBrlToCents('1.250,50')).toBe(125050);
    expect(parseBrlToCents('R$ 0,99')).toBe(99);
  });

  it('rejeita valores inválidos', () => {
    expect(parseBrlToCents('')).toBeNull();
    expect(parseBrlToCents('abc')).toBeNull();
    expect(parseBrlToCents('10,999')).toBeNull();
    expect(parseBrlToCents('-5')).toBeNull();
  });

  it('formata centavos para input', () => {
    expect(centsToInput(2500)).toBe('25,00');
  });
});
