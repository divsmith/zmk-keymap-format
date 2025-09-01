interface Binding {
    macro: string;
    args: string[];
}

interface TemplateCell {
    row: number;
    col: number;
    originalColStart: number; // The character index of the '|' that starts this cell in the template line
}

interface TemplateRow {
    cells: TemplateCell[];
}

type Template = TemplateRow[];

interface FormattedCell {
    binding: Binding | null;
    formattedString: string;
    macroWidth: number;
    argsWidth: number;
}

interface FormattedRow {
    cells: FormattedCell[];
}

interface FormattedGrid {
    rows: FormattedRow[];
    maxCols: number;
}

interface MappedFormattedData {
    formattedGrid: FormattedGrid;
    columnMacroWidths: number[];
    columnArgsWidths: number[];
}

export function formatDocument(document: string): string {
    const lines = document.split('\n');
    let templateStart = -1;

    // Find template section
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('// Keymap Template')) {
            templateStart = i;
            break;
        }
    }

    if (templateStart === -1) {
        return document; // No template found, return original document
    }

    // Parse template
    const templateLines = [];
    let templateLineIndent = 0; // To store the indentation of the first template line
    for (let i = templateStart + 1; i < lines.length; i++) {
        if (lines[i].includes('| * |')) {
            if (templateLines.length === 0) { // First template line
                const match = lines[i].match(/^(\s*)/);
                templateLineIndent = match ? match[1].length : 0;
            }
            templateLines.push(lines[i]);
        } else {
            break;
        }
    }

    const template = parseTemplate(templateLines, templateLineIndent);

    // Find all bindings blocks
    const bindingsStarts: number[] = [];
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('bindings = <')) {
            bindingsStarts.push(i);
        }
    }

    // Process each bindings block
    // Iterate in reverse to avoid issues with line number changes due to splice
    for (let i = bindingsStarts.length - 1; i >= 0; i--) {
        const currentBindingsStart = bindingsStarts[i];
        let currentBindingsEnd = -1;

        // Find the corresponding '>;'
        for (let j = currentBindingsStart + 1; j < lines.length; j++) {
            if (lines[j].includes('>;')) {
                currentBindingsEnd = j;
                break;
            }
        }

        if (currentBindingsEnd === -1) {
            continue; // Malformed block, skip
        }

        // Extract the original indentation of the bindings block
        const bindingsBlockIndentMatch = lines[currentBindingsStart].match(/^(\s*)/);
        const bindingsBlockIndent = bindingsBlockIndentMatch ? bindingsBlockIndentMatch[1] : '';

        // Extract raw bindings content (assuming it's on the next line)
        const rawBindingsLine = lines[currentBindingsStart + 1].trim();
        const parsedBindings = parseBindings(rawBindingsLine);

        // Map bindings to template and format
        const { formattedGrid, columnMacroWidths, columnArgsWidths } = mapAndFormatBindings(template, parsedBindings);

        // Generate the new bindings content, indented relative to the bindings block
        const newBindingsContent = generateFormattedBindings(formattedGrid, template, columnMacroWidths, columnArgsWidths)
            .split('\n')
            .map(line => bindingsBlockIndent + line) // Add the original block indentation
            .join('\n');

        // Replace the old bindings content with the new one
        // `lines` array is modified directly
        const newBindingsContentLines = newBindingsContent.split('\n');
        lines.splice(currentBindingsStart + 1, currentBindingsEnd - (currentBindingsStart + 1), ...newBindingsContentLines);
    }

    return lines.join('\n');
}

function parseTemplate(templateLines: string[], templateLineIndent: number): Template {
    const template: Template = [];
    let maxCols = 0;

    const regex = /\|\s*\*\s*\|/g; // Original regex

    templateLines.forEach((line, rowIndex) => {
        const row: TemplateCell[] = [];
        let colIndex = 0;
        
        // Get all matches first
        for (const match of line.matchAll(regex)) {
            row.push({
                row: rowIndex,
                col: colIndex++,
                originalColStart: match.index! + 2 - templateLineIndent // Adjusted to point to the '*' relative to template block start
            });
        }
        template.push({ cells: row });
        if (colIndex > maxCols) {
            maxCols = colIndex;
        }
    });

    return template;
}

function parseBindings(rawBindings: string): Binding[] {
    const bindings: Binding[] = [];
    const parts = rawBindings.split(/\s+/).filter(p => p.length > 0);

    let currentBinding: Binding | null = null;
    for (const part of parts) {
        if (part.startsWith('&')) {
            if (currentBinding) {
                bindings.push(currentBinding);
            }
            currentBinding = { macro: part, args: [] };
        } else if (currentBinding) {
            currentBinding.args.push(part);
        }
    }
    if (currentBinding) {
        bindings.push(currentBinding);
    }
    return bindings;
}

function mapAndFormatBindings(template: Template, bindings: Binding[]): MappedFormattedData {
    const formattedGrid: FormattedGrid = { rows: [], maxCols: 0 };
    let bindingIndex = 0;

    // Determine maxCols from template
    template.forEach(row => {
        if (row.cells.length > formattedGrid.maxCols) {
            formattedGrid.maxCols = row.cells.length;
        }
    });

    template.forEach((templateRow, rowIndex) => {
        const formattedRow: FormattedRow = { cells: [] };
        templateRow.cells.forEach(templateCell => {
            const binding = bindings[bindingIndex] || null;
            formattedRow.cells.push({
                binding: binding,
                formattedString: '', // Will be filled later
                macroWidth: 0,
                argsWidth: 0
            });
            if (binding) {
                bindingIndex++;
            }
        });
        formattedGrid.rows.push(formattedRow);
    });

    // Calculate macro and argument widths for alignment
    const columnMacroWidths: number[] = Array(formattedGrid.maxCols).fill(0);
    const columnArgsWidths: number[] = Array(formattedGrid.maxCols).fill(0);

    formattedGrid.rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, cellIndex) => {
            if (cell.binding) {
                const templateColIndex = template[rowIndex].cells[cellIndex].col;
                cell.macroWidth = cell.binding.macro.length;
                cell.argsWidth = cell.binding.args.reduce((sum, arg) => sum + arg.length + 1, 0) - (cell.binding.args.length > 0 ? 1 : 0); // Sum of arg lengths + spaces
                
                // Update max macro width for this column
                if (cell.macroWidth > columnMacroWidths[templateColIndex]) {
                    columnMacroWidths[templateColIndex] = cell.macroWidth;
                }

                // Update max args width for this column (only if binding has args)
                if (cell.binding.args.length > 0 && cell.argsWidth > columnArgsWidths[templateColIndex]) {
                    columnArgsWidths[templateColIndex] = cell.argsWidth;
                }
            }
        });
    });

    // Format each cell (this is a preliminary format, final format happens in generateFormattedBindings)
    formattedGrid.rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, cellIndex) => {
            if (cell.binding) {
                const templateColIndex = template[rowIndex].cells[cellIndex].col;
                const macroPadding = ' '.repeat(columnMacroWidths[templateColIndex] - cell.macroWidth);
                const argsString = cell.binding.args.join(' ');
                const argsPadding = ' '.repeat(columnArgsWidths[templateColIndex] - cell.argsWidth);
                
                cell.formattedString = `${cell.binding.macro}${macroPadding}`;
                if (cell.binding.args.length > 0) {
                    cell.formattedString += ` ${argsString}${argsPadding}`;
                }
                // cell.formattedString = cell.formattedString.trimEnd(); // Removed trimEnd()
            }
        });
    });

    return { formattedGrid, columnMacroWidths, columnArgsWidths };
}

function generateFormattedBindings(
    formattedGrid: FormattedGrid,
    template: Template,
    columnMacroWidths: number[], // New parameter
    columnArgsWidths: number[]   // New parameter
): string {
    const outputLines: string[] = [];

    outputLines.push(`DEBUG: formattedGrid.rows.length = ${formattedGrid.rows.length}`);

    formattedGrid.rows.forEach((row, idx) => {
        let currentLine = '';
        outputLines.push(`DEBUG:   row ${idx}: cells.length = ${row.cells.length}`);

        const templateRow = template[idx]; // Re-added templateRow

        // Get the initial indentation from the template line
        let baseIndent = 0; // We'll let formatDocument handle the overall block indent

        // Add initial indentation for the line
        currentLine += ' '.repeat(baseIndent);

        let lastCellEndPosition = baseIndent; // Tracks the absolute end position of the last placed cell

        row.cells.forEach((cell, cellIndex) => {
            const currentTemplateCell = templateRow.cells[cellIndex];
            const targetColIndex = currentTemplateCell.col;

            // Calculate the formatted content for the current cell using global max widths
            let formattedCellContent = '';
            if (cell.binding) {
                const macroPadding = ' '.repeat(columnMacroWidths[targetColIndex] - cell.macroWidth);
                const argsString = cell.binding.args.join(' ');
                const argsPadding = ' '.repeat(columnArgsWidths[targetColIndex] - cell.argsWidth);
                
                formattedCellContent = `${cell.binding.macro}${macroPadding}`;
                if (cell.binding.args.length > 0) {
                    formattedCellContent += ` ${argsString}${argsPadding}`;
                }
                // formattedCellContent = formattedCellContent.trimEnd(); // Removed trimEnd()
            }

            // Calculate padding to align the current cell
            // The current cell should start at `currentTemplateCell.originalColStart` (absolute position)
            // relative to the start of the line.
            let padding = currentTemplateCell.originalColStart - lastCellEndPosition;

            if (cellIndex > 0 && padding < 1) { // Ensure at least one space between columns
                padding = 1;
            }
            
            currentLine += ' '.repeat(padding);
            currentLine += formattedCellContent;
            lastCellEndPosition = currentLine.length;
        });
        outputLines.push(currentLine); // Removed trimEnd()
    });

    return outputLines.join('\n');
}
