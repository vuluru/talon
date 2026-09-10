import { marked } from 'marked';

export class Print {
  /**
   * Print the current document content by rendering markdown to HTML
   * and opening the OS print dialog. Cleans up after printing/cancel.
   */
  async printDocument(markdown: string): Promise<void> {
    // Convert markdown to HTML using same path as Preview
    const html = marked.parse(markdown) as string;
    
    // Create hidden iframe for print rendering
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    printFrame.style.visibility = 'hidden';
    
    document.body.appendChild(printFrame);
    
    // Wait for iframe to load
    await new Promise<void>((resolve) => {
      printFrame.onload = () => resolve();
      
      // Write print document with basic styling
      const printDoc = printFrame.contentDocument || printFrame.contentWindow?.document;
      if (printDoc) {
        printDoc.open();
        printDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>Print Preview</title>
              <style>
                @media print {
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 12pt;
                    line-height: 1.6;
                    color: #000;
                    background: #fff;
                    margin: 0;
                    padding: 20mm;
                  }
                  
                  h1, h2, h3, h4, h5, h6 {
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                    font-weight: 600;
                    line-height: 1.3;
                  }
                  
                  h1 { font-size: 20pt; }
                  h2 { font-size: 16pt; }
                  h3 { font-size: 14pt; }
                  
                  p {
                    margin: 0.8em 0;
                  }
                  
                  ul, ol {
                    margin: 0.8em 0;
                    padding-left: 2em;
                  }
                  
                  li {
                    margin: 0.3em 0;
                  }
                  
                  code {
                    font-family: 'Courier New', monospace;
                    background: #f5f5f5;
                    padding: 0.1em 0.3em;
                    border-radius: 2px;
                  }
                  
                  pre {
                    background: #f5f5f5;
                    padding: 1em;
                    border-radius: 4px;
                    overflow-x: auto;
                  }
                  
                  pre code {
                    background: none;
                    padding: 0;
                  }
                  
                  blockquote {
                    margin: 1em 0;
                    padding-left: 1em;
                    border-left: 3px solid #ccc;
                    color: #666;
                  }
                  
                  a {
                    color: #000;
                    text-decoration: underline;
                  }
                  
                  table {
                    border-collapse: collapse;
                    width: 100%;
                    margin: 1em 0;
                  }
                  
                  th, td {
                    border: 1px solid #ccc;
                    padding: 0.5em;
                    text-align: left;
                  }
                  
                  th {
                    background: #f5f5f5;
                    font-weight: 600;
                  }
                }
                
                @media screen {
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    padding: 20px;
                  }
                }
              </style>
            </head>
            <body>
              ${html}
            </body>
          </html>
        `);
        printDoc.close();
      }
    });
    
    // Give browser a moment to render
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Open OS print dialog
      const printWindow = printFrame.contentWindow;
      if (printWindow) {
        printWindow.print();
      }
    } finally {
      // Clean up iframe after a delay (allows print/cancel to complete)
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 100);
    }
  }
}
