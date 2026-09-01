/**
 * JavaScript Hoisting Concepts & Helper Utilities (Frontend)
 *
 * Demonstrates:
 * 1. Function Declaration Hoisting (Available anywhere in scope before definition)
 * 2. Function Expression vs Declaration Hoisting differences
 * 3. Variable Hoisting (`var` initialized to undefined vs `let`/`const` in Temporal Dead Zone)
 */

/**
 * Top-level invocation demonstrating that hoisted function declarations
 * can be safely called BEFORE their physical declaration in source code.
 */
export function processHoistedData(data, formatter) {
  // Calling hoisted functions defined below in this file
  const normalized = normalizeDataKey(data);
  const validated = validateInputStructure(normalized);
  return formatter ? formatter(validated) : validated;
}

/**
 * Function Declaration - Fully hoisted (both identifier and implementation are moved
 * to the top of the execution context during creation phase).
 */
export function normalizeDataKey(key) {
  if (!key) return '';
  return String(key).trim().toLowerCase();
}

/**
 * Function Declaration - Fully hoisted to module scope.
 */
export function validateInputStructure(input) {
  if (typeof input === 'string') return input.length > 0;
  if (Array.isArray(input)) return input.length;
  if (typeof input === 'object' && input !== null) return Object.keys(input).length > 0;
  return Boolean(input);
}

/**
 * Illustrates Hoisting differences between var, let, and const:
 * - `var`: hoisted and initialized with `undefined`.
 * - `let` / `const`: hoisted into the Temporal Dead Zone (TDZ), throws ReferenceError if accessed early.
 */
export function demonstrateTemporalDeadZone() {
  const result = {
    varBehavior: 'Hoisted to scope top and initialized as undefined',
    letConstBehavior: 'Hoisted into TDZ; accessing before declaration throws ReferenceError',
    functionDeclarationBehavior: 'Hoisted with full body implementation',
  };
  return result;
}

/**
 * Hoisted ingredient formatting utility used in Pantry and Recipe UI components
 */
export function formatIngredientQuantity(quantity, unit) {
  if (quantity === undefined || quantity === null) return '';
  const num = parseFloat(quantity);
  const formatted = isNaN(num) ? quantity : num.toFixed(2).replace(/\.?0+$/, '');
  return `${formatted} ${unit || ''}`.trim();
}
