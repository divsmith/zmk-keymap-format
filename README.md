# ZMK Keymap Format

A Visual Studio Code extension for formatting ZMK keymap files.

## Features

This extension provides formatting support for `.keymap` files used in ZMK (Zephyr Mechanical Keyboard) projects.

## Development

### Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Compile the extension:
   ```
   npm run compile
   ```

3. Run tests:
   ```
   npm test
   ```

### Testing

Tests are written using Mocha and can be run with:
```
npm test
```

### Structure

- `src/extension.ts` - Main extension entry point
- `src/formatter.ts` - Formatting logic
- `src/test/unit/` - Unit tests

## Release Notes

### 0.0.1

Initial release of ZMK Keymap Format extension.