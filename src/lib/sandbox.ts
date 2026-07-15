import JSZip from "jszip";

export interface SandboxFile {
  path: string;
  content: string;
  language: string;
}

/**
 * Extracts and aggregates all code files generated inside markdown blocks.
 * Supports multiple formats of file declarations:
 * 1. File: src/App.tsx
 *    ```tsx
 *    ...
 *    ```
 * 2. ```tsx [FILE: src/App.tsx]
 *    ...
 *    ```
 * 3. ```tsx
 *    // FILE: src/App.tsx
 *    ...
 *    ```
 */
export function extractSandboxFiles(text: string): SandboxFile[] {
  const files: SandboxFile[] = [];

  // 1. Regular expression to match:
  // ```lang [FILE: path] or ```lang FILE: path
  const blockHeaderRegex = /```(\w*)\s*(?:\[FILE:\s*([^\]\s]+)\]|FILE:\s*(\S+))?\s*[\r\n]+([\s\S]*?)```/gi;
  let match;

  while ((match = blockHeaderRegex.exec(text)) !== null) {
    const language = match[1] || "txt";
    let filePath = match[2] || match[3] || "";
    let blockContent = match[4];

    // Check inside the block's first few lines for comment declarations
    if (!filePath) {
      const firstLines = blockContent.split("\n").slice(0, 5);
      for (const line of firstLines) {
        const commentMatch = line.match(/(?:\/\/|#|<!--|\/\*)\s*(?:FILE|File|file|Path|path|PATH):\s*([a-zA-Z0-9_\-\.\/]+)\s*(?:-->|\*\/)?/i);
        if (commentMatch) {
          filePath = commentMatch[1];
          break;
        }
      }
    }

    if (filePath) {
      filePath = cleanFilePath(filePath);
      // Keep only unique latest blocks of files (though aggregation handles this later)
      files.push({
        path: filePath,
        content: blockContent,
        language: language,
      });
    }
  }

  // 2. Regular expression to match separate "File: path" followed by ```lang codeblock
  const separateHeaderRegex = /(?:File|FILE|Path|PATH|الملف):\s*([a-zA-Z0-9_\-\.\/]+)\s*[\r\n]+```(\w*)\s*[\r\n]+([\s\S]*?)```/gi;
  while ((match = separateHeaderRegex.exec(text)) !== null) {
    const filePath = cleanFilePath(match[1]);
    const language = match[2] || "txt";
    const blockContent = match[3];

    if (!files.some((f) => f.path === filePath)) {
      files.push({
        path: filePath,
        content: blockContent,
        language: language,
      });
    }
  }

  return files;
}

function cleanFilePath(path: string): string {
  return path.trim().replace(/^[\.\/]+/, "").replace(/^[\\\/]+/, "");
}

/**
 * Scans all assistant messages in a chat and returns an aggregated map of files.
 * This ensures that if the AI edits or updates files across turns, the user gets the latest code!
 */
export function aggregateChatFiles(messages: { role: string; content: string }[]): SandboxFile[] {
  const fileMap: { [path: string]: SandboxFile } = {};

  messages.forEach((msg) => {
    if (msg.role === "assistant") {
      const msgFiles = extractSandboxFiles(msg.content);
      msgFiles.forEach((f) => {
        // Overwrite or create with the latest content
        fileMap[f.path] = f;
      });
    }
  });

  return Object.values(fileMap);
}

/**
 * Triggers a browser-download for a zip file populated with sandbox files.
 */
export async function downloadZip(files: SandboxFile[], projectName: string = "aura-project") {
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "project"}.zip`;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
