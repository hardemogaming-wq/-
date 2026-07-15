import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export default function CodeBlock({ language = "code", value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code: ", err);
    }
  };

  // Basic regex-based syntax highlight function for code presentation
  const highlightCode = (code: string, lang: string) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    if (!lang) return escaped;

    const lowerLang = lang.toLowerCase();

    // Custom coloring rules for common languages (JS, TS, Python, HTML, CSS, JSON, Shell)
    if (["javascript", "typescript", "js", "ts"].includes(lowerLang)) {
      const jsRegex = /(\/\/.*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|return|import|export|from|default|class|extends|constructor|super|if|else|for|while|try|catch|finally|async|await|new|typeof|instanceof|implements|interface|type|public|private|protected|static|as)\b)|(\b[a-zA-Z_]\w*(?=\s*\())|(\b\d+\b)/g;
      return escaped.replace(jsRegex, (match, comment, str, keyword, fn, num) => {
        if (comment) return `<span class="text-neutral-500 italic">${comment}</span>`;
        if (str) return `<span class="text-emerald-400">${str}</span>`;
        if (keyword) return `<span class="text-purple-400 font-semibold">${keyword}</span>`;
        if (fn) return `<span class="text-blue-400">${fn}</span>`;
        if (num) return `<span class="text-amber-400">${num}</span>`;
        return match;
      });
    }

    if (["python", "py"].includes(lowerLang)) {
      const pyRegex = /(#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\b(?:def|class|return|import|from|as|if|elif|else|for|while|in|is|and|or|not|try|except|finally|with|lambda|pass|break|continue)\b)|(\b[a-zA-Z_]\w*(?=\s*\())|(@[a-zA-Z_]\w*)|(\b\d+\b)/g;
      return escaped.replace(pyRegex, (match, comment, str, keyword, fn, decorator, num) => {
        if (comment) return `<span class="text-neutral-500 italic">${comment}</span>`;
        if (str) return `<span class="text-emerald-400">${str}</span>`;
        if (keyword) return `<span class="text-purple-400 font-semibold">${keyword}</span>`;
        if (fn) return `<span class="text-blue-400">${fn}</span>`;
        if (decorator) return `<span class="text-amber-400">${decorator}</span>`;
        if (num) return `<span class="text-amber-400">${num}</span>`;
        return match;
      });
    }

    if (["html", "xml"].includes(lowerLang)) {
      const htmlRegex = /(&lt;!--[\s\S]*?--&gt;)|(&lt;\/?[a-zA-Z0-9:-]+)|(\s[a-zA-Z0-9:-]+=)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|(\/?&gt;)/g;
      return escaped.replace(htmlRegex, (match, comment, tagStart, attrName, attrValue, tagEnd) => {
        if (comment) return `<span class="text-neutral-500 italic">${comment}</span>`;
        if (tagStart) return `<span class="text-blue-400">${tagStart}</span>`;
        if (attrName) return `<span class="text-purple-400">${attrName}</span>`;
        if (attrValue) return `<span class="text-emerald-400">${attrValue}</span>`;
        if (tagEnd) return `<span class="text-blue-400">${tagEnd}</span>`;
        return match;
      });
    }

    if (["css"].includes(lowerLang)) {
      const cssRegex = /(\/\*[\s\S]*?\*\/)|([a-zA-Z0-9_.-]+(?=\s*\{))|([a-zA-Z-]+\s*:)|(:\s*[^;}]+)/g;
      return escaped.replace(cssRegex, (match, comment, selector, property, val) => {
        if (comment) return `<span class="text-neutral-500 italic">${comment}</span>`;
        if (selector) return `<span class="text-blue-400">${selector}</span>`;
        if (property) return `<span class="text-purple-400">${property}</span>`;
        if (val) return `<span class="text-emerald-400">${val}</span>`;
        return match;
      });
    }

    if (["json"].includes(lowerLang)) {
      const jsonRegex = /("(?:\\.|[^"\\])*"(?=\s*:))|((?::\s*)("(?:\\.|[^"\\])*"))|(\b(?:true|false|null|\d+)\b)/g;
      return escaped.replace(jsonRegex, (match, key, valWithColon, valStr, literal) => {
        if (key) return `<span class="text-blue-400 font-medium">${key}</span>`;
        if (valWithColon) {
          return `: <span class="text-emerald-400">${valStr}</span>`;
        }
        if (literal) return `<span class="text-amber-400">${literal}</span>`;
        return match;
      });
    }

    if (["bash", "sh", "shell", "cmd"].includes(lowerLang)) {
      const bashRegex = /(#.*)|(^(?:\$\s).*)|(\b(?:echo|cd|ls|mkdir|rm|cp|mv|sudo|apt|npm|git|docker|pip|python|node|npx)\b)/gm;
      return escaped.replace(bashRegex, (match, comment, prompt, keyword) => {
        if (comment) return `<span class="text-neutral-500 italic">${comment}</span>`;
        if (prompt) return `<span class="text-blue-400 font-semibold">${prompt}</span>`;
        if (keyword) return `<span class="text-purple-400">${keyword}</span>`;
        return match;
      });
    }

    return escaped;
  };

  const highlighted = highlightCode(value, language);

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-neutral-800/80 bg-neutral-900/90 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between bg-neutral-950/70 px-4 py-2.5 border-b border-neutral-900/60 font-sans">
        <div className="flex items-center space-x-2">
          {/* Mac-style colored dots */}
          <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
          <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
          <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
          <span className="ml-2 text-xs font-mono text-neutral-400/90 tracking-wider uppercase bg-neutral-900 px-2 py-0.5 rounded border border-neutral-800/40">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 rounded-lg bg-neutral-900 border border-neutral-800 px-2.5 py-1 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-white transition-all active:scale-95 cursor-pointer"
          title="Copy to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-neutral-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code body */}
      <div className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-neutral-300 antialiased max-h-[500px]">
        <pre className="whitespace-pre">
          <code
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        </pre>
      </div>
    </div>
  );
}
