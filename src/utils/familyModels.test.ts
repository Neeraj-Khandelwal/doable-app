import { describe, it, expect } from 'vitest';
import { validateFamilyName, validateKidName, isValidFamilyColor } from './familyModels';

// ── validateFamilyName ────────────────────────────────────────────────────────

describe('validateFamilyName', () => {
  it('accepts a normal name', () => {
    expect(validateFamilyName('Smith Family')).toBe(true);
  });

  it('accepts minimum 2 characters', () => {
    expect(validateFamilyName('AB')).toBe(true);
  });

  it('accepts maximum 50 characters', () => {
    expect(validateFamilyName('A'.repeat(50))).toBe(true);
  });

  it('rejects 1 character', () => {
    expect(validateFamilyName('A')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(validateFamilyName('')).toBe(false);
  });

  it('rejects more than 50 characters', () => {
    expect(validateFamilyName('A'.repeat(51))).toBe(false);
  });

  it('trims whitespace before validating', () => {
    expect(validateFamilyName('  A  ')).toBe(false); // only 1 char after trim
    expect(validateFamilyName('  AB  ')).toBe(true);  // 2 chars after trim
  });
});

// ── validateKidName ───────────────────────────────────────────────────────────

describe('validateKidName', () => {
  it('accepts a normal name', () => {
    expect(validateKidName('Alice')).toBe(true);
  });

  it('accepts minimum 1 character', () => {
    expect(validateKidName('A')).toBe(true);
  });

  it('accepts maximum 30 characters', () => {
    expect(validateKidName('A'.repeat(30))).toBe(true);
  });

  it('rejects empty string', () => {
    expect(validateKidName('')).toBe(false);
  });

  it('rejects more than 30 characters', () => {
    expect(validateKidName('A'.repeat(31))).toBe(false);
  });

  it('trims whitespace before validating', () => {
    expect(validateKidName('   ')).toBe(false); // empty after trim
    expect(validateKidName(' A ')).toBe(true);  // 1 char after trim
  });
});

// ── isValidFamilyColor ────────────────────────────────────────────────────────

describe('isValidFamilyColor', () => {
  it('accepts all valid colors', () => {
    const validColors = ['lavender', 'peach', 'mint', 'sky', 'amber', 'rose'];
    validColors.forEach(color => {
      expect(isValidFamilyColor(color)).toBe(true);
    });
  });

  it('rejects an unknown color', () => {
    expect(isValidFamilyColor('blue')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidFamilyColor('')).toBe(false);
  });

  it('is case-sensitive — rejects uppercase', () => {
    expect(isValidFamilyColor('Lavender')).toBe(false);
    expect(isValidFamilyColor('ROSE')).toBe(false);
  });
});
