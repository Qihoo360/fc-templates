import { describe, it, expect } from 'vitest';
import { Handlebars, compile, registerHelper } from '../../../src/services/template/minimal';

describe('Minimal Template Solution', () => {
  it('should work with direct Handlebars usage', () => {
    const template = Handlebars.compile('Hello {{name}}!');
    const result = template({ name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should work with convenience compile function', () => {
    const template = compile('Hello {{name}}!');
    const result = template({ name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should allow users to register their own helpers', () => {
    registerHelper('shout', (str: string) => str.toUpperCase() + '!!!');
    
    const template = compile('{{shout greeting}}');
    const result = template({ greeting: 'hello' });
    expect(result).toBe('HELLO!!!');
  });

  it('should work with built-in Handlebars features', () => {
    const template = compile('{{#if show}}Hello {{name}}!{{/if}}');
    const result = template({ show: true, name: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('should work with loops', () => {
    const template = compile('{{#each items}}{{this}} {{/each}}');
    const result = template({ items: ['a', 'b', 'c'] });
    expect(result).toBe('a b c ');
  });
}); 