const fs = require('node:fs');
const path = require('node:path');

const darkTokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'dark.json'), 'utf-8'));
const lightTokens = JSON.parse(fs.readFileSync(path.join(__dirname, 'light.json'), 'utf-8'));

function isValidCSSVariableName(name) {
  return /^--[a-zA-Z0-9_-]+$/.test(name);
}

function normalizeCSSVariableName(name) {
  const hasPrefix = name.startsWith('--');
  const nameWithoutPrefix = hasPrefix ? name.slice(2) : name;

  // Normalize the name part (without the --)
  let normalized = nameWithoutPrefix
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
    .toLowerCase();

  if (!normalized) {
    normalized = 'variable';
  }

  return `--${normalized}`;
}

// Function to convert JSON structure to CSS custom properties
function convertTokensToCSS(tokens, themeName, collectColors = false) {
  const cssVariables = [];
  const normalizedVariables = [];
  const colorTokens = [];

  function processObject(obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        if (value.value && value.type === 'color') {
          let variableName = key;

          if (!isValidCSSVariableName(key)) {
            variableName = normalizeCSSVariableName(key);
            normalizedVariables.push({
              original: key,
              normalized: variableName,
            });
          }

          cssVariables.push(`  ${variableName}: ${value.value};`);

          // Collect color tokens for Tailwind configuration
          if (collectColors) {
            colorTokens.push({
              variableName,
              value: value.value,
            });
          }
        } else {
          processObject(value);
        }
      }
    }
  }

  processObject(tokens);

  // Generate CSS content
  const cssContent = `${themeName === 'dark' ? '.dark' : ':root'} {
${cssVariables.join('\n')}
}`;

  if (normalizedVariables.length > 0) {
    console.log(`📋 ${themeName} theme - Normalized ${normalizedVariables.length} variable(s):`);
    for (const { original, normalized } of normalizedVariables) {
      console.log(`   ${original} → ${normalized}`);
    }
  }

  return { cssContent, colorTokens };
}

const darkResult = convertTokensToCSS(darkTokens, 'dark');
const lightResult = convertTokensToCSS(lightTokens, 'light', true); // Collect colors from light theme

const combinedCSS = `/* Refly Design System - Color Tokens */
/* Light Theme */
${lightResult.cssContent}

/* Dark Theme */
${darkResult.cssContent}`;

fs.writeFileSync(path.join(__dirname, '../src/tokens.css'), combinedCSS);

// Generate Tailwind colors configuration from collected tokens
const tailwindColors = {};
for (const { variableName } of lightResult.colorTokens) {
  const tailwindKey = variableName.replace(/^--/, '');
  tailwindColors[tailwindKey] = `var(${variableName})`;
}

const sortedColors = Object.keys(tailwindColors)
  .sort()
  .reduce((acc, key) => {
    acc[key] = tailwindColors[key];
    return acc;
  }, {});

const colorsConfig = `// Auto-generated Tailwind colors configuration
// This file is generated from token files, do not edit manually

export const reflyColors = ${JSON.stringify(sortedColors, null, 2).replace(/"/g, "'")} as const;
`;

fs.writeFileSync(path.join(__dirname, '../tailwind-colors.ts'), colorsConfig);

console.log('✅ CSS files generated successfully!');
console.log('📁 Generated files:');
console.log('  - tokens.css (combined)');
console.log('  - tailwind-colors.ts (Tailwind configuration)');
console.log(`📊 Generated ${Object.keys(sortedColors).length} color tokens`);
