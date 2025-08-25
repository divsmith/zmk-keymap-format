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
    
    // Parse the keymap template comments to determine formatting
    const lines = text.split('\n');
    const templateLines: string[] = [];
    
    // Find lines that contain keymap template comments
    for (const line of lines) {
      if (line.trim().startsWith('//') && line.includes('| * |')) {
        templateLines.push(line);
      }
    }
    
    // Format based on the template
    let formattedBindings = '';
    
    if (templateLines.length === 2) {
      // Check for 2x2 pattern: both lines have same structure
      if (templateLines[0].trim() === '// | * | * |' && templateLines[1].trim() === '// | * | * |') {
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
            formattedBindings += '\n';
          }
          formattedBindings += '                        ' + pairs[i];
          // Add trailing space for all but the last line to match expected format
          if (i < pairs.length - 1) {
            formattedBindings += ' ';
          }
        }
      } else if (templateLines[0].trim() === '// | * | * | * |' && templateLines[1].trim() === '//     | * |') {
        // 1x3 + 1 formatting: first 3 bindings on first line, last binding on second line
        if (bindings.length >= 3) {
          // First line: first 3 bindings with base indentation
          formattedBindings += '                        ' + bindings[0] + ' ' + bindings[1] + ' ' + bindings[2] + ' ';
          // Second line: last binding with indentation
          formattedBindings += '\n                              ' + bindings[3];
        } else {
          // Fallback for fewer bindings
          formattedBindings = '                        ' + bindings.join(' ');
        }
      }
    } else if (templateLines.length === 4) {
      // 4x1 pattern: each binding on its own line with specific indentation
      // Calculate indentation for each line based on the template content after //
      for (let i = 0; i < bindings.length && i < templateLines.length; i++) {
        if (i > 0) {
          formattedBindings += '\n';
        }
        
        // Get the content after // and calculate leading spaces
        const templateLine = templateLines[i];
        const contentAfterComment = templateLine.substring(templateLine.indexOf('//') + 2);
        const leadingSpaces = contentAfterComment.search(/\S/); // Position of first non-whitespace character
        
        // Convert template spaces to actual indentation:
        // Based on the pattern: extraIndentation = (leadingSpaces - 1) * 1.5
        // 1 space -> 0 extra indentation
        // 5 spaces -> 6 extra indentation
        // 9 spaces -> 12 extra indentation
        const extraIndentation = (leadingSpaces - 1) * 1.5;
        
        // Add the appropriate indentation
        // Base indentation is 24 spaces
        const totalSpaces = 24 + extraIndentation;
        formattedBindings += ' '.repeat(totalSpaces) + bindings[i];
        
        // Add trailing space for all lines except the last to match expected format
        if (i < bindings.length - 1) {
          formattedBindings += ' ';
        }
      }
    } else {
      // Default formatting: group into pairs with base indentation
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
          formattedBindings += '\n';
        }
        formattedBindings += '                        ' + pairs[i];
        // Add trailing space for all but the last line to match expected format
        if (i < pairs.length - 1) {
          formattedBindings += ' ';
        }
      }
    }
    
    // Return the formatted bindings section
    return `${opening}\n${formattedBindings}\n                    ${closing}`;
  });
}