import * as vscode from 'vscode';
import { formatDocument } from './formatter';

export function activate(context: vscode.ExtensionContext) {
  // Register our formatter
  const formatter = vscode.languages.registerDocumentFormattingEditProvider('keymap', {
    provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
      // Get the full document text
      const text = document.getText();
      
      // Format the document
      const formattedText = formatDocument(text);
      
      // Return an edit that replaces the entire document
      return [
        vscode.TextEdit.replace(
          new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
          ),
          formattedText
        )
      ];
    }
  });

  context.subscriptions.push(formatter);
}

export function deactivate() {}