import { describe, it, expect, afterEach } from 'vitest';
import { parseRgba, alphaBlend, resolveBackgroundColor } from './color-picker';

describe('parseRgba', () => {
  it('should parse "rgb(0, 0, 0)" to {r:0, g:0, b:0, a:1}', () => {
    expect(parseRgba('rgb(0, 0, 0)')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });

  it('should parse "rgba(255, 0, 0, 0.5)" to {r:255, g:0, b:0, a:0.5}', () => {
    expect(parseRgba('rgba(255, 0, 0, 0.5)')).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 0.5,
    });
  });

  it('should parse "rgb(255, 255, 255)" to {r:255, g:255, b:255, a:1}', () => {
    expect(parseRgba('rgb(255, 255, 255)')).toEqual({
      r: 255,
      g: 255,
      b: 255,
      a: 1,
    });
  });

  it('should return {r:0, g:0, b:0, a:1} for unparseable input', () => {
    expect(parseRgba('invalid')).toEqual({ r: 0, g: 0, b: 0, a: 1 });
  });
});

describe('alphaBlend', () => {
  it('should return foreground unchanged when foreground is fully opaque', () => {
    const fg = { r: 200, g: 100, b: 50, a: 1 };
    const bg = { r: 0, g: 0, b: 255, a: 1 };
    const result = alphaBlend(fg, bg);
    expect(result).toEqual({ r: 200, g: 100, b: 50, a: 1 });
  });

  it('should return background unchanged when foreground is fully transparent', () => {
    const fg = { r: 255, g: 0, b: 0, a: 0 };
    const bg = { r: 0, g: 128, b: 255, a: 1 };
    const result = alphaBlend(fg, bg);
    expect(result).toEqual({ r: 0, g: 128, b: 255, a: 1 });
  });

  it('should blend rgba(255,0,0,0.5) over rgba(0,0,255,1.0) correctly', () => {
    const fg = { r: 255, g: 0, b: 0, a: 0.5 };
    const bg = { r: 0, g: 0, b: 255, a: 1.0 };
    const result = alphaBlend(fg, bg);
    // outA = 0.5 + 1.0 * 0.5 = 1.0
    // outR = (255*0.5 + 0*1.0*0.5) / 1.0 = 127.5 → 128
    // outG = (0*0.5 + 0*1.0*0.5) / 1.0 = 0
    // outB = (0*0.5 + 255*1.0*0.5) / 1.0 = 127.5 → 128
    expect(result).toEqual({ r: 128, g: 0, b: 128, a: 1 });
  });

  it('should produce components within valid ranges', () => {
    const fg = { r: 255, g: 255, b: 255, a: 0.8 };
    const bg = { r: 255, g: 255, b: 255, a: 1.0 };
    const result = alphaBlend(fg, bg);
    expect(result.r).toBeGreaterThanOrEqual(0);
    expect(result.r).toBeLessThanOrEqual(255);
    expect(result.g).toBeGreaterThanOrEqual(0);
    expect(result.g).toBeLessThanOrEqual(255);
    expect(result.b).toBeGreaterThanOrEqual(0);
    expect(result.b).toBeLessThanOrEqual(255);
    expect(result.a).toBeGreaterThanOrEqual(0);
    expect(result.a).toBeLessThanOrEqual(1);
  });

  it('should return {r:0, g:0, b:0, a:0} when both colors are fully transparent', () => {
    const fg = { r: 100, g: 200, b: 50, a: 0 };
    const bg = { r: 50, g: 100, b: 200, a: 0 };
    const result = alphaBlend(fg, bg);
    expect(result).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });
});

describe('resolveBackgroundColor', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should return the element color directly when it is opaque', () => {
    const el = document.createElement('div');
    el.style.backgroundColor = 'rgb(100, 150, 200)';
    document.body.appendChild(el);

    const result = resolveBackgroundColor(el);
    expect(result).toBe('rgb(100, 150, 200)');
  });

  it('should return parent color when element is transparent over opaque parent', () => {
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'rgb(0, 128, 0)';
    const child = document.createElement('div');
    child.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    parent.appendChild(child);
    document.body.appendChild(parent);

    const result = resolveBackgroundColor(child);
    expect(result).toBe('rgb(0, 128, 0)');
  });

  it('should fall back to white (#FFFFFF) when entire chain is transparent', () => {
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    const child = document.createElement('div');
    child.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    parent.appendChild(child);
    document.body.appendChild(parent);

    const result = resolveBackgroundColor(child);
    expect(result).toBe('rgb(255, 255, 255)');
  });

  it('should always produce an opaque result (no alpha component in output)', () => {
    const grandparent = document.createElement('div');
    grandparent.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
    const parent = document.createElement('div');
    parent.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
    const child = document.createElement('div');
    child.style.backgroundColor = 'rgba(0, 0, 255, 0.3)';
    grandparent.appendChild(parent);
    parent.appendChild(child);
    document.body.appendChild(grandparent);

    const result = resolveBackgroundColor(child);
    // Result should be in the format "rgb(r, g, b)" — no alpha
    expect(result).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
  });
});
