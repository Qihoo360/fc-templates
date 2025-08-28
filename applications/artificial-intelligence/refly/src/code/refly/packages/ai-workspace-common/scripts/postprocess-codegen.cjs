const { readFileSync, writeFileSync } = require('node:fs');
const { execSync } = require('node:child_process');
const { join } = require('node:path');

/**
 * Gets the biome executable path from pnpm bin
 */
function getBiomePath() {
  try {
    // Get pnpm bin directory
    const biomePath = join(__dirname, '..', '..', '..', 'node_modules', '.bin', 'biome');

    // Check if biome exists in pnpm bin
    try {
      execSync(`"${biomePath}" --version`, { encoding: 'utf-8' });
      return biomePath;
    } catch {
      // Fallback to system biome if not found in pnpm bin
      return 'biome';
    }
  } catch {
    console.warn('Could not get pnpm bin directory, falling back to system biome');
    return 'biome';
  }
}

/**
 * Prints biome version and path information
 */
function printBiomeInfo() {
  try {
    console.log('=== Biome Information ===');

    const biomePath = getBiomePath();

    // Get biome version
    const version = execSync(`"${biomePath}" --version`, {
      encoding: 'utf-8',
    }).trim();
    console.log(`Biome Version: ${version}`);

    // Get biome path
    console.log(`Biome Path: ${biomePath}`);
    console.log('========================\n');
  } catch (error) {
    console.error('Error getting biome information:', error.message);
    console.log('Make sure biome is installed and available in PATH\n');
  }
}

/**
 * Runs biome check on specified directories
 * @param directories - Array of directory paths to check
 */
function runBiomeCheck(directories) {
  try {
    const biomePath = getBiomePath();

    for (const dir of directories) {
      console.log(`Running biome check on ${dir}...`);
      const command = `"${biomePath}" check ${dir} --write --no-errors-on-unmatched`;
      execSync(command, { stdio: 'inherit' });
      console.log(`Successfully ran biome check on ${dir}`);
    }
  } catch (error) {
    console.error('Error running biome check:', error);
    process.exit(1);
  }
}

/**
 * Adds @ts-nocheck to the top of a given file
 * @param filePath - Path to the file to modify
 */
function addTsNoCheck(filePath) {
  try {
    // Read the file content
    const content = readFileSync(filePath, 'utf-8');

    // Check if @ts-nocheck already exists
    if (content.includes('@ts-nocheck')) {
      console.log(`File ${filePath} already contains @ts-nocheck`);
      return;
    }

    // Add @ts-nocheck to the top of the file
    const newContent = `// @ts-nocheck\n${content}`;

    // Write the modified content back to the file
    writeFileSync(filePath, newContent, 'utf-8');

    console.log(`Successfully added @ts-nocheck to ${filePath}`);
  } catch (error) {
    console.error(`Error processing file ${filePath}:`, error);
    process.exit(1);
  }
}

/**
 * Processes queries workflow - runs biome check and adds ts-nocheck to queries.ts
 */
function postprocessQueries() {
  // Get the root directory of the source code
  const srcDir = join(__dirname, '..', 'src');

  // Define directories to run biome check on
  const directoriesToCheck = [join(srcDir, 'requests'), join(srcDir, 'queries')];

  // Define the queries file path
  const queriesFilePath = join(srcDir, 'queries', 'queries.ts');

  console.log('Starting queries processing...');

  // First run biome check on the specified directories
  runBiomeCheck(directoriesToCheck);

  // Then add ts-nocheck to queries/queries.ts
  addTsNoCheck(queriesFilePath);

  console.log('Queries processing completed successfully!');
}

/**
 * Main function to handle command line arguments
 */
function main() {
  // Print biome information at the beginning
  printBiomeInfo();

  postprocessQueries();
}

main();
