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

  // 1. Regular expression for markdown blocks (standard logic)
  const blockHeaderRegex = /```(\w*)\s*(?:\[FILE:\s*([^\]\s]+)\]|FILE:\s*(\S+))?\s*[\r\n]+([\s\S]*?)```/gi;
  let match;
  while ((match = blockHeaderRegex.exec(text)) !== null) {
    const language = match[1] || "txt";
    let filePath = match[2] || match[3] || "";
    let blockContent = match[4];
    if (!filePath) {
      const firstLines = blockContent.split("\n").slice(0, 5);
      for (const line of firstLines) {
        const commentMatch = line.match(/(?:\/\/|#|<!--|\/\*)\s*(?:FILE|File|file|Path|path|PATH):\s*([a-zA-Z0-9_\-\.\/]+)\s*(?:-->|\*\/)?/i);
        if (commentMatch) { filePath = commentMatch[1]; break; }
      }
    }
    if (filePath) {
      files.push({ path: cleanFilePath(filePath), content: blockContent, language: language });
    }
  }

  // 2. NEW: Regex for "cat << 'EOF' > path" commands (Agent Mode)
  // This helps detect files even if they are NOT in markdown blocks but inside JSON commands
  const catRegex = /cat\s+<<\s*['"]?EOF['"]?\s*>\s*([^\s\n\(\);&\|]+)[\s\n\\]+([\s\S]*?)EOF/gi;
  while ((match = catRegex.exec(text)) !== null) {
    const filePath = cleanFilePath(match[1].replace(/['"]/g, ""));
    const content = match[2].trim().replace(/\\n/g, "\n").replace(/\\"/g, '"');
    if (!files.some(f => f.path === filePath)) {
      files.push({
        path: filePath,
        content: content,
        language: detectLanguage(filePath)
      });
    }
  }

  // 3. Regex for "File: path" followed by ``` blocks
  const separateHeaderRegex = /(?:\*\*|__)?(?:File|FILE|Path|PATH|الملف):\s*([a-zA-Z0-9_\-\.\/]+)(?:\*\*|__)?\s*[\r\n]+```(\w*)\s*[\r\n]+([\s\S]*?)```/gi;
  while ((match = separateHeaderRegex.exec(text)) !== null) {
    const filePath = cleanFilePath(match[1]);
    if (!files.some((f) => f.path === filePath)) {
      files.push({ path: filePath, content: match[3], language: match[2] || "txt" });
    }
  }

  return files;
}

function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "dart": return "dart";
    case "yaml": return "yaml";
    case "py": return "python";
    case "js": return "javascript";
    case "ts": return "typescript";
    case "tsx": return "tsx";
    case "html": return "html";
    case "css": return "css";
    case "json": return "json";
    default: return "txt";
  }
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
      // First, check if content is a JSON object from Agent Mode
      let contentToExtract = msg.content;
      try {
        const firstBrace = msg.content.indexOf('{');
        const lastBrace = msg.content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          const potentialJson = msg.content.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(potentialJson);
          if (parsed.command) contentToExtract += "\n" + parsed.command;
        }
      } catch (e) {}

      const msgFiles = extractSandboxFiles(contentToExtract);
      msgFiles.forEach((f) => {
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
