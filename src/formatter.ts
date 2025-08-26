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
    let i = 0;
    while (i < tokens.length) {
      if (tokens[i].startsWith('&')) {
        // This is the start of a binding
        let binding = tokens[i];
        i++;
        // Collect all subsequent tokens that don't start with & (parameters)
        while (i < tokens.length && !tokens[i].startsWith('&')) {
          binding += ' ' + tokens[i];
          i++;
        }
        bindings.push(binding);
      } else {
        // Skip any token that doesn't start with & (shouldn't happen in valid input)
        i++;
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
      if (leadingSpaces < minIndentation && leadingSpaces >= 0) {
        minIndentation = leadingSpaces;
      }
    }
    
    // If no valid indentation found, set to 0
    if (minIndentation === Infinity) {
      minIndentation = 0;
    }
    
    // Normalize relative indentations (subtract minimum to get relative offsets)
    // Then multiply by 2 to match expected spacing pattern
    const normalizedIndentations = relativeIndentations.map(indent => (indent - minIndentation) * 2);
    
    // Parse bindings into macro + key components for padding calculation
    const parsedBindings = bindings.map(binding => {
      const parts = binding.split(' ');
      if (parts.length >= 2) {
        // Macro is the first part, key is everything else joined with spaces
        const macro = parts[0];
        const key = parts.slice(1).join(' ');
        return {
          original: binding,
          macro: macro,
          key: key,
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
    
    // Calculate maximum width for the entire binding and for macro/key parts separately for each column
    const columnWidths: number[] = columnBindings.map(column => {
      return column.length > 0 ? Math.max(...column.map(binding => binding.width)) : 0;
    });
    
    const columnMacroWidths: number[] = [];
    const columnKeyWidths: number[] = [];
    
    for (let i = 0; i < columnBindings.length; i++) {
      const column = columnBindings[i];
      if (column.length > 0) {
        columnMacroWidths[i] = Math.max(...column.map(binding => binding.macro.length));
        columnKeyWidths[i] = Math.max(...column.map(binding => binding.key.length));
      } else {
        columnMacroWidths[i] = 0;
        columnKeyWidths[i] = 0;
      }
    }
    
    // Create padded bindings
    const paddedBindings: string[] = parsedBindings.map((binding, index) => {
      // Find which column this binding is in
      let colIndex = 0;
      
      // Recalculate position to find column
      bindingIndex = 0;
      let found = false;
      for (let i = 0; i < templateLines.length && !found; i++) {
        const templateLine = templateLines[i];
        const contentAfterComment = templateLine.substring(templateLine.indexOf('//') + 2).trim();
        const starCount = (contentAfterComment.match(/\*/g) || []).length;
        
        for (let j = 0; j < starCount && bindingIndex < parsedBindings.length; j++) {
          if (bindingIndex === index) {
            colIndex = j;
            found = true;
            break;
          }
          bindingIndex++;
        }
      }
      
      // Format the binding with proper alignment
      if (binding.key) {
        // For bindings, check if we need to align keys within the column
        // Only align macros if all keys in the column have the same length
        const column = columnBindings[colIndex] || [];
        const keysInColumn = column.filter(b => b.key).map(b => b.key);
        const allKeysSameLength = keysInColumn.length > 0 && 
          keysInColumn.every(key => key.length === keysInColumn[0].length);
        const allKeysHaveLength = keysInColumn.length === column.length; // All bindings have keys
        
        if (allKeysSameLength && allKeysHaveLength) {
          // Align the macro parts so that keys align within the column
          // Find how much padding the macro needs to align the key properly
          const macroPadding = columnMacroWidths[colIndex] - binding.macro.length;
          const formattedBinding = binding.macro + ' '.repeat(macroPadding + 1) + binding.key;
          const totalPadding = columnWidths[colIndex] - formattedBinding.length;
          return formattedBinding + ' '.repeat(Math.max(0, totalPadding));
        } else {
          // For bindings with keys of different lengths, just pad at the end to match column width
          const totalPadding = columnWidths[colIndex] - binding.width;
          return binding.original + ' '.repeat(Math.max(0, totalPadding));
        }
      } else {
        // For bindings without keys, just pad to match column width
        const totalPadding = columnWidths[colIndex] - binding.width;
        return binding.original + ' '.repeat(Math.max(0, totalPadding));
      }
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
      const totalIndentation = 24 + (normalizedIndentations[i] || 0);
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
    return opening + '\n' + formattedBindings + '\n                    ' + closing;
  });
}