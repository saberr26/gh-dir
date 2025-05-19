import boxen from 'boxen';
import chalk from 'chalk';

// Debug mode flag - set to false to hide debug output
let debugMode = false;

// Boxen configuration for different message types
const boxenConfig = {
  success: {
    padding: 1,
    margin: 1,
    borderStyle: 'round' as const,
    borderColor: 'green',
    backgroundColor: '#000',
  },
  info: {
    padding: 1,
    margin: 1,
    borderStyle: 'round' as const,
    borderColor: 'blue',
    backgroundColor: '#000',
  },
  warning: {
    padding: 1,
    margin: 1,
    borderStyle: 'round' as const,
    borderColor: 'yellow',
    backgroundColor: '#000',
  },
  error: {
    padding: 1,
    margin: 1,
    borderStyle: 'round' as const,
    borderColor: 'red',
    backgroundColor: '#000',
  },
  summary: {
    padding: 1,
    margin: 1,
    borderStyle: 'round' as const,
    borderColor: 'cyan',
    backgroundColor: '#000',
    title: 'Summary',
    titleAlignment: 'center' as const,
  },
  // New tip box configuration
  tip: {
    padding: 1,
    margin: 1,
    borderStyle: 'round' as const,
    borderColor: 'magenta',
    backgroundColor: '#000',
    title: 'Tip',
    titleAlignment: 'center' as const,
  }
};

/**
 * Set debug mode
 * @param enable Whether to enable debug mode
 */
export function setDebugMode(enable: boolean): void {
  debugMode = enable;
}

/**
 * Log a debug message (only shown in debug mode)
 * @param message The message to log
 */
export function debug(message: string): void {
  if (debugMode) {
    console.log(chalk.gray(`[DEBUG] ${message}`));
  }
}

/**
 * Log an info message
 * @param message The message to log
 * @param boxed Whether to display the message in a box
 */
export function info(message: string, boxed = false): void {
  if (boxed) {
    console.log(boxen(chalk.blue(message), boxenConfig.info));
  } else {
    console.log(chalk.blue(`ℹ ${message}`));
  }
}

/**
 * Log a success message
 * @param message The message to log
 * @param boxed Whether to display the message in a box
 */
export function success(message: string, boxed = false): void {
  if (boxed) {
    console.log(boxen(chalk.green(message), boxenConfig.success));
  } else {
    console.log(chalk.green(`✓ ${message}`));
  }
}

/**
 * Log a warning message
 * @param message The message to log
 * @param boxed Whether to display the message in a box
 */
export function warning(message: string, boxed = false): void {
  if (boxed) {
    console.log(boxen(chalk.yellow(message), boxenConfig.warning));
  } else {
    console.log(chalk.yellow(`⚠ ${message}`));
  }
}

/**
 * Log an error message
 * @param message The message to log
 * @param boxed Whether to display the message in a box
 */
export function error(message: string, boxed = false): void {
  if (boxed) {
    console.log(boxen(chalk.red(message), boxenConfig.error));
  } else {
    console.log(chalk.red(`✗ ${message}`));
  }
}

/**
 * Display a summary box with multiple lines
 * @param lines Array of lines to display in the summary box
 */
export function summary(lines: string[]): void {
  const content = lines.join('\n');
  console.log(boxen(content, boxenConfig.summary));
}

/**
 * Display a tip box
 * @param message The message to display in the tip box
 */
export function tip(message: string): void {
  console.log(boxen(chalk.magenta(message), boxenConfig.tip));
}

export default {
  setDebugMode,
  debug,
  info,
  success,
  warning,
  error,
  summary,
  tip
};
