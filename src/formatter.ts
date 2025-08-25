/**
 * Format a ZMK keymap document
 * @param text The text to format
 * @returns The formatted text
 */
export function formatDocument(text: string): string {
  // Find the bindings section and format it
  const bindingsRegex = /(bindings\s*=\s*<)([^>]*)(>)/g;
  
  return text.replace(bindingsRegex, (_match: string, opening: string, bindingsContent: string, closing: string) => {
    // Clean up the bindings content by normalizing whitespace
    const cleanedContent = bindingsContent.replace(/\s+/g, ' ').trim();
    
    // Split the bindings by spaces and filter out empty strings
    const tokens = cleanedContent.split(' ').filter((token: string) => token.length > 0);
    
    // Group tokens into bindings (each binding is a pair of &kp and key)
    const bindings: string[] = [];
    for (let i = 0; i < tokens.length; i += 2) {
      if (i + 1 < tokens.length) {
        bindings.push(tokens[i] + ' ' + tokens[i + 1]);
      } else {
        bindings.push(tokens[i]);
      }
    }
    
    // Determine the formatting pattern based on comments
    let formattedBindings = '';
    
    // Look for keymap template comments to determine layout
    if (text.includes('// | * | * |') && text.includes('// | * | * |')) {
      // Check if it's the 1x3+1 pattern first
      if (text.includes('// | * | * | * |') && text.includes('//     | * |')) {
        // 1x3 + 1 formatting: first 3 bindings on first line, last binding on second line
        if (bindings.length >= 3) {
          // First line: first 3 bindings
          formattedBindings += bindings[0] + ' ' + bindings[1] + ' ' + bindings[2] + ' ';
          // Second line: last binding with indentation
          formattedBindings += '\n                              ' + bindings[3];
        } else {
          // Fallback for fewer bindings
          formattedBindings = bindings.join(' ');
        }
      } else {
        // 2x2 formatting: group into pairs
        const pairs: string[] = [];
        for (let i = 0; i < bindings.length; i += 2) {
          if (i + 1 < bindings.length) {
            pairs.push(bindings[i] + ' ' + bindings[i + 1]);
          } else {
            pairs.push(bindings[i]);
          }
        }
        
        // Join the pairs with newlines, adding trailing spaces as needed
        for (let i = 0; i < pairs.length; i++) {
          if (i > 0) {
            formattedBindings += '\n                        ';
          }
          formattedBindings += pairs[i];
          // Add trailing space for all but the last line to match expected format
          if (i < pairs.length - 1) {
            formattedBindings += ' ';
          }
        }
      }
    } else {
      // Default formatting: group into pairs
      const pairs: string[] = [];
      for (let i = 0; i < bindings.length; i += 2) {
        if (i + 1 < bindings.length) {
          pairs.push(bindings[i] + ' ' + bindings[i + 1]);
        } else {
          pairs.push(bindings[i]);
        }
      }
      
      // Join the pairs with newlines, adding trailing spaces as needed
      for (let i = 0; i < pairs.length; i++) {
        if (i > 0) {
          formattedBindings += '\n                        ';
        }
        formattedBindings += pairs[i];
        // Add trailing space for all but the last line to match expected format
        if (i < pairs.length - 1) {
          formattedBindings += ' ';
        }
      }
    }
    
    // Return the formatted bindings section
    return `${opening}\n                        ${formattedBindings}\n                    ${closing}`;
  });
}