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
    
    // Group tokens into bindings (each binding starts with &)
    const bindings: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].startsWith('&')) {
        // This is the start of a binding
        if (i + 1 < tokens.length && !tokens[i + 1].startsWith('&')) {
          // Next token is part of this binding
          bindings.push(tokens[i] + ' ' + tokens[i + 1]);
          i++; // Skip the next token
        } else {
          // This is a standalone binding (shouldn't happen in practice)
          bindings.push(tokens[i]);
        }
      }
    }
    
    // Parse the keymap template comments
    const lines = text.split('\n');
    const templateLines: string[] = [];
    
    // Find lines that contain keymap template comments
    for (const line of lines) {
      if (line.trim().startsWith('//') && line.includes('| * |')) {
        templateLines.push(line);
      }
    }
    
    // Calculate relative indentation for each template line
    const relativeIndentations: number[] = [];
    let minIndentation = Infinity;
    
    // Find the minimum indentation to establish baseline
    for (const templateLine of templateLines) {
      const contentAfterComment = templateLine.substring(templateLine.indexOf('//') + 2);
      const leadingSpaces = contentAfterComment.search(/\S/);
      relativeIndentations.push(leadingSpaces);
      if (leadingSpaces < minIndentation) {
        minIndentation = leadingSpaces;
      }
    }
    
    // Normalize relative indentations (subtract minimum to get relative offsets)
    // Then multiply by 2 to match expected spacing pattern
    const normalizedIndentations = relativeIndentations.map(indent => (indent - minIndentation) * 2);
    
    // Parse bindings into macro + key components for padding calculation
    const parsedBindings = bindings.map(binding => {
      const parts = binding.split(' ');
      if (parts.length === 2) {
        return {
          original: binding,
          macro: parts[0],
          key: parts[1],
          width: binding.length
        };
      }
      return {
        original: binding,
        macro: binding,
        key: '',
        width: binding.length
      };
    });
    
    // Group bindings by column for width calculation
    const columnBindings: {original: string, macro: string, key: string, width: number}[][] = [];
    let bindingIndex = 0;
    
    // First pass: group bindings by column
    for (let i = 0; i < templateLines.length; i++) {
      const templateLine = templateLines[i];
      const contentAfterComment = templateLine.substring(templateLine.indexOf('//') + 2).trim();
      const starCount = (contentAfterComment.match(/\*/g) || []).length;
      
      for (let j = 0; j < starCount && bindingIndex < parsedBindings.length; j++) {
        const colIndex = j;
        if (!columnBindings[colIndex]) {
          columnBindings[colIndex] = [];
        }
        columnBindings[colIndex].push(parsedBindings[bindingIndex]);
        bindingIndex++;
      }
    }
    
    // Calculate maximum width for each column
    const columnWidths: number[] = columnBindings.map(column => {
      return Math.max(...column.map(binding => binding.width));
    });
    
    // Create padded bindings
    const paddedBindings: string[] = parsedBindings.map((binding, index) => {
      // Find which column this binding is in
      let colIndex = 0;
      let bindingPosition = 0;
      
      // Recalculate position to find column
      bindingIndex = 0;
      for (let i = 0; i < templateLines.length; i++) {
        const templateLine = templateLines[i];
        const contentAfterComment = templateLine.substring(templateLine.indexOf('//') + 2).trim();
        const starCount = (contentAfterComment.match(/\*/g) || []).length;
        
        for (let j = 0; j < starCount && bindingIndex < parsedBindings.length; j++) {
          if (bindingIndex === index) {
            colIndex = j;
            bindingPosition = bindingIndex;
            break;
          }
          bindingIndex++;
        }
        if (bindingIndex === index) break;
      }
      
      // If this column has a max width and this binding is shorter, add padding
      if (columnWidths[colIndex] && binding.width < columnWidths[colIndex]) {
        const widthDiff = columnWidths[colIndex] - binding.width;
        // For &kp bindings, add the extra space between macro and key
        if (binding.macro === '&kp' && binding.key) {
          return `${binding.macro}${' '.repeat(widthDiff + 1)}${binding.key}`;
        }
        // For other bindings, add space at the end
        return `${binding.original}${' '.repeat(widthDiff)}`;
      }
      return binding.original;
    });
    
    // Reset bindingIndex for the formatting pass
    bindingIndex = 0;
    
    // Create the formatted bindings by replacing * with bindings
    let formattedBindings = '';
    
    // Process each template line
    for (let i = 0; i < templateLines.length; i++) {
      if (i > 0) {
        formattedBindings += '\n';
      }
      
      // Get the content after // and process it
      const templateLine = templateLines[i];
      const contentAfterComment = templateLine.substring(templateLine.indexOf('//') + 2).trim();
      
      // Replace all * with corresponding bindings in this line
      let processedLine = contentAfterComment;
      const starCount = (contentAfterComment.match(/\*/g) || []).length;
      
      for (let j = 0; j < starCount && bindingIndex < paddedBindings.length; j++) {
        processedLine = processedLine.replace('*', paddedBindings[bindingIndex]);
        bindingIndex++;
      }
      
      // Apply proper indentation: base 24 spaces + normalized relative indentation
      const totalIndentation = 24 + normalizedIndentations[i];
      formattedBindings += ' '.repeat(totalIndentation) + processedLine;
    }
    
    // Handle any remaining bindings that weren't placed in the template
    while (bindingIndex < paddedBindings.length) {
      if (formattedBindings.length > 0) {
        formattedBindings += '\n';
      }
      // Add with default indentation (24 spaces)
      formattedBindings += '                        ' + paddedBindings[bindingIndex];
      bindingIndex++;
    }
    
    // Return the formatted bindings section
    return `${opening}\n${formattedBindings}\n                    ${closing}`;
  });
}