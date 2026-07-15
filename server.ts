import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { exec } from "child_process";
import { promisify } from "util";
import multer from "multer";
import fs from "fs";

const execPromise = promisify(exec);

function robustParseJSON(text: string): any {
  if (!text) {
    throw new Error("Empty text");
  }

  // 1. Try a direct standard JSON parse
  try {
    return JSON.parse(text.trim());
  } catch (e) {}

  // 2. Try to extract JSON from a ```json ... ``` code block
  const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1].trim());
    } catch (e) {}
  }

  // 3. Find the first '{' and trace to find the matching '}'
  // This avoids greedy matching that captures extra curly braces in following code blocks.
  const firstBrace = text.indexOf('{');
  if (firstBrace !== -1) {
    let braceCount = 0;
    let insideString = false;
    let escape = false;
    for (let i = firstBrace; i < text.length; i++) {
      const char = text[i];
      if (insideString) {
        if (escape) {
          escape = false;
        } else if (char === '\\') {
          escape = true;
        } else if (char === '"') {
          insideString = false;
        }
      } else {
        if (char === '"') {
          insideString = true;
        } else if (char === '{') {
          braceCount++;
        } else if (char === '}') {
          braceCount--;
          if (braceCount === 0) {
            const potentialJson = text.substring(firstBrace, i + 1);
            try {
              return JSON.parse(potentialJson);
            } catch (e) {
              // Ignore and let it fallback/try other methods
            }
          }
        }
      }
    }
  }

  // 4. Try standard greedy match as a final fallback
  const greedyMatch = text.match(/\{[\s\S]*\}/);
  if (greedyMatch) {
    try {
      return JSON.parse(greedyMatch[0]);
    } catch (e) {}
  }

  throw new Error("No valid JSON object found in model output.");
}

dotenv.config();

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

function sanitizeMessages(messages: any[], systemPrompt: string) {
  const cleanMessages = messages.filter(
    (msg) => msg && typeof msg.content === "string" && msg.content.trim().length > 0
  );

  const result: { role: string; content: string }[] = [];
  result.push({ role: "system", content: systemPrompt });

  for (const msg of cleanMessages) {
    let role = msg.role;
    if (role === "system") {
      role = "user";
    }

    if (result.length === 1) {
      result.push({ role: "user", content: msg.content });
    } else {
      const lastMsg = result[result.length - 1];
      if (lastMsg.role === role) {
        lastMsg.content += "\n\n" + msg.content;
      } else {
        result.push({ role, content: msg.content });
      }
    }
  }

  return result;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Middleware for parsing JSON and URL-encoded bodies with high limits
  app.use(express.json({ limit: "100mb" }));
  app.use(express.urlencoded({ limit: "100mb", extended: true }));

  // Log requests for debugging - Move to top to catch all requests
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // Health check endpoint for deployment platforms
  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // API Router
  const apiRouter = express.Router();

  // Middleware to log all API requests
  apiRouter.use((req, res, next) => {
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  // API Route for File Uploads
  apiRouter.post("/upload", (req, res, next) => {
    console.log(`[Upload] Incoming request: ${req.method} ${req.url}`);
    next();
  }, upload.single("file"), async (req, res) => {
    try {
      console.log("[Upload] Multer processed request. File:", req.file ? req.file.originalname : "None");
      if (!req.file) {
        console.error("Upload failed: No file in request");
        return res.status(400).json({ error: "No file uploaded or invalid field name." });
      }

      const filePath = path.join("uploads", req.file.filename);
      console.log(`[Upload] File saved successfully: ${req.file.originalname} -> ${filePath}`);
      
      // Auto-parse XML files using our robust parse_xml.py script
      const originalName = req.file.originalname.toLowerCase();
      let autoParseMsg = "";
      if (originalName.endsWith(".xml")) {
        let fileType = "";
        let outJson = "";
        
        if (originalName.includes("quran")) {
          fileType = "quran";
          outJson = "quran_data.json";
        } else if (originalName.includes("muyassar") || originalName.includes("tafsir")) {
          fileType = "tafsir";
          outJson = "tafsir_muyassar.json";
        } else if (originalName.includes("sahih") || originalName.includes("translation") || originalName.includes("en")) {
          fileType = "translation";
          outJson = "english_translation_data.json";
        }

        if (fileType && outJson) {
          try {
            console.log(`[Upload] Triggering auto-parse for ${originalName} as ${fileType} to ${outJson}...`);
            const { stdout, stderr } = await execPromise(`python3 parse_xml.py "./${filePath}" "${outJson}" "${fileType}"`);
            console.log(`[Upload] Auto-parse stdout: ${stdout}`);
            if (stderr) console.warn(`[Upload] Auto-parse stderr: ${stderr}`);
            autoParseMsg = ` Automatically parsed and updated ${outJson}.`;
          } catch (parseError: any) {
            console.error(`[Upload] Auto-parse failed:`, parseError);
            autoParseMsg = ` Failed to parse XML: ${parseError.message}`;
          }
        }
      }

      res.status(200).json({
        name: req.file.originalname,
        path: `./${filePath}`,
        size: req.file.size,
        mimetype: req.file.mimetype,
        message: `File uploaded successfully.${autoParseMsg}`
      });
    } catch (error: any) {
      console.error("[Upload] Server error:", error);
      res.status(500).json({ error: error.message || "Upload failed." });
    }
  });

  // API Route for App Icon Upload & Processing
  apiRouter.post("/upload-icon", (req, res, next) => {
    console.log(`[IconUpload] Request received: ${req.method} ${req.url}`);
    next();
  }, upload.single("icon"), async (req, res) => {
    try {
      console.log("[IconUpload] Multer processing complete.");
      if (!req.file) {
        console.error("[IconUpload] No file provided in request. Check if field name is 'icon'");
        return res.status(400).json({ error: "No icon file uploaded. Ensure the field name is 'icon'." });
      }

      console.log(`[IconUpload] File received: ${req.file.originalname} (${req.file.size} bytes)`);
      const iconPath = path.join(process.cwd(), "uploads", req.file.filename);
      
      // Define Android resource paths
      const mipmapDirs = [
        "mipmap-mdpi",
        "mipmap-hdpi",
        "mipmap-xhdpi",
        "mipmap-xxhdpi",
        "mipmap-xxxhdpi"
      ];

      const resBaseDir = path.join(process.cwd(), "android/app/src/main/res");

      // Process each directory
      for (const dir of mipmapDirs) {
        const fullDirPath = path.join(resBaseDir, dir);
        if (!fs.existsSync(fullDirPath)) {
          fs.mkdirSync(fullDirPath, { recursive: true });
        }
        const targetPath = path.join(fullDirPath, "ic_launcher.png");
        fs.copyFileSync(iconPath, targetPath);
      }

      console.log(`[IconUpload] Processed app icon for all mipmap densities.`);

      res.status(200).json({ 
        message: "Icon uploaded and processed successfully.",
        url: `/uploads/${req.file.filename}` 
      });
    } catch (error: any) {
      console.error("[IconUpload] Error:", error);
      res.status(500).json({ error: error.message || "Failed to process icon." });
    }
  });

  // API Route for Chat completions using Hugging Face Serverless Inference API (Qwen/Qwen2.5-Coder-32B-Instruct)
  apiRouter.post("/chat", async (req, res) => {
    try {
      const { messages, stream = true, deepThinking = false, webSearch = false, deepSearch = false } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const openrouterKey = process.env.OPENROUTER_API_KEY;
      const hfToken = process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN;
      const systemContent = "You are Aura-AI, a sleek, futuristic AI assistant specialized in software engineering. Created by 'يوسف محمد عبد الفتاح'. Respond in the same language as the user's query. Use clean formatting. Files must be in Markdown code blocks with 'File: path' header.";

      if (!openrouterKey && !hfToken) {
        return res.status(400).json({ 
          error: "مفتاح OPENROUTER_API_KEY أو HUGGINGFACE_TOKEN غير موجود. الرجاء إضافته في إعدادات AI Studio (Secrets)." 
        });
      }
      
      const apiUrl = openrouterKey 
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://router.huggingface.co/v1/chat/completions";

      const maxHistory = 10;
      const historyToBatch = messages.slice(-maxHistory);

      const formattedMessages = sanitizeMessages(historyToBatch, systemContent);

      const model = openrouterKey ? "openai/gpt-oss-120b" : "Qwen/Qwen3-Coder-30B-A3B-Instruct";

      console.log(`[Aura-AI] Forwarding to ${openrouterKey ? 'OpenRouter' : 'Router'} (Model: ${model}, Stream: ${stream})...`);
      
      const headers: any = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openrouterKey || hfToken}`,
      };

      if (openrouterKey) {
        headers["HTTP-Referer"] = process.env.APP_URL || "https://ai.studio/build";
        headers["X-Title"] = "Aura-AI Builder";
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          model: model,
          messages: formattedMessages,
          stream: stream,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorJson.error || errorText;
        } catch (e) { /* ignore */ }
        
        console.error(`[Aura-AI] API Error (${openrouterKey ? 'OpenRouter' : 'HF'}):`, response.status, errorMessage);
        throw new Error(`${openrouterKey ? 'OpenRouter' : 'HF'} Error: ${response.status} - ${errorMessage}`);
      }

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        try {
          if (!response.body) {
            throw new Error("No response body received from Hugging Face API.");
          }

          // Handle streaming response robustly for any environment / runtime
          if (typeof (response.body as any).getReader === "function") {
            const reader = (response.body as any).getReader();
            const decoder = new TextDecoder("utf-8");
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(decoder.decode(value, { stream: true }));
            }
          } else {
            // Fallback if response.body acts as a node stream
            for await (const chunk of response.body as any) {
              res.write(chunk);
            }
          }
          res.end();
        } catch (streamError: any) {
          console.error("[Aura-AI] Streaming error:", streamError);
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n⚠️ **Streaming Error**: ${streamError.message}` } }] })}\n\n`);
          res.write("data: [DONE]\n\n");
          res.end();
        }
      } else {
        const data = await response.json();
        res.json(data);
      }
    } catch (error: any) {
      console.error("General API generation error:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // API Route for Agent Mode (Reasoning Loop + Tool Use)
  apiRouter.post("/agent", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Messages array is required." });
      }

      const openrouterKey = process.env.OPENROUTER_API_KEY;
      const hfToken = process.env.HUGGINGFACE_TOKEN || process.env.HF_TOKEN;
      const agentSystemPrompt = "You are Aura-AI in Agent Mode, created by 'يوسف محمد عبد الفتاح'. Respond in the same language as the user's query. " +
        "Solve tasks using JSON: {\"thought\":\"...\",\"tool\":\"run_command\"/\"none\",\"command\":\"...\",\"response_to_user\":\"...\"}. " +
        "Keep response_to_user in Arabic.\n\n" +
        "SYSTEM ENVIRONMENT: You are running in a robust Docker environment with 'python3', 'pip', 'node', and 'npm' pre-installed.\n\n" +
        "STRICT OPERATIONAL RULES:\n" +
        "1. JSON-ONLY RESPONSE (MANDATORY): You MUST output ONLY a raw JSON object. DO NOT use markdown code blocks (NO ```json). DO NOT include text outside the JSON. If you include text outside, the system will CRASH.\n" +
        "2. FRAMEWORK ADHERENCE: Build the app using the EXACT framework requested (e.g., Flutter). Never default to React.\n" +
        "3. PROJECT ROOT: Place all files (pubspec.yaml, lib/, etc.) in the root `./`.\n" +
        "4. ATOMIC FILE WRITING: Write ONE file per iteration. Use: `mkdir -p dir && cat << 'EOF' > dir/file\n[CONTENT]\nEOF`.\n" +
        "5. MULTI-LINE PRECISION: You MUST use real newlines inside the file content. YAML is sensitive to spaces. Ensure correct indentation (2 spaces).\n" +
        "6. NO ESCAPED NEWLINES: Do not use `\\n` literals inside the file content. Use actual line breaks.\n" +
        "7. CONTINUITY: You are an autonomous builder. Write files one after another until the codebase is complete. DO NOT wait for the user between files.\n" +
        "8. NO SYSTEM COMMANDS: Do not run `flutter create`. Focus on writing logic and config.\n" +
        "9. SILENT INSTALLS: Install libraries silently if needed (e.g., `pip install ... && python ...`).\n" +
        "10. VERIFICATION: After writing a file, immediately proceed to the next one without waiting.";

      const maxAgentHistory = 6;
      const historyToBatch = messages.slice(-maxAgentHistory);

      // Set up SSE
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      if (!openrouterKey && !hfToken) {
        res.write(`data: ${JSON.stringify({ error: "مفتاح OPENROUTER_API_KEY أو HUGGINGFACE_TOKEN غير موجود. الرجاء إضافته في إعدادات AI Studio (Secrets)." })}\n\n`);
        res.write("data: [DONE]\n\n");
        return res.end();
      }

      const apiUrl = openrouterKey 
        ? "https://openrouter.ai/api/v1/chat/completions"
        : "https://router.huggingface.co/v1/chat/completions";

      const model = openrouterKey ? "openai/gpt-oss-120b" : "Qwen/Qwen3-Coder-30B-A3B-Instruct";

      let currentHistory = sanitizeMessages(historyToBatch, agentSystemPrompt);

      let iterations = 0;
      const MAX_ITERATIONS = 5;

      while (iterations < MAX_ITERATIONS) {
        iterations++;
        console.log(`[Agent-Loop] Iteration ${iterations}`);

        try {
          const headers: any = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openrouterKey || hfToken}`,
          };

          if (openrouterKey) {
            headers["HTTP-Referer"] = process.env.APP_URL || "https://ai.studio/build";
            headers["X-Title"] = "Aura-AI Builder";
          }

          const response = await fetch(apiUrl, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
              model: model,
              messages: currentHistory,
              stream: false, 
              max_tokens: 8192,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = errorText;
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = errorJson.error?.message || errorJson.error || errorText;
            } catch (e) { /* ignore */ }
            throw new Error(`HF Error: ${response.status} - ${errorMessage}`);
          }

          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;

          if (!content) {
            console.error("[Agent] Empty response data:", data);
            throw new Error("The model returned an empty response.");
          }

          // Attempt to parse JSON
          let parsed: any;
          try {
            parsed = robustParseJSON(content);
          } catch (parseErr) {
            console.warn("[Agent] Malformed JSON from model, falling back to treating as plain text response:", content);
            // Fallback gracefully so the model's textual response is still returned to the user
            parsed = {
              thought: "Model output was not in JSON format. Displaying raw text.",
              tool: "none",
              command: "",
              response_to_user: content
            };
          }

          // Send current state to frontend
          res.write(`data: ${JSON.stringify({ type: "agent_update", ...parsed })}\n\n`);

          if (parsed.tool === "run_command" && parsed.command) {
            console.log(`[Agent] Executing: ${parsed.command}`);
            let cmdOutput = "";
            try {
              const { stdout, stderr } = await execPromise(parsed.command, { 
                timeout: 30000,
                maxBuffer: 1024 * 1024 * 10 // 10MB buffer
              });
              cmdOutput = stdout + (stderr ? `\n--- STDERR ---\n${stderr}` : "");
              if (!cmdOutput) cmdOutput = "(Command executed successfully with no output)";
            } catch (execErr: any) {
              console.error(`[Agent] Command failed: ${parsed.command}`, execErr);
              cmdOutput = `Execution Failed (Exit Code: ${execErr.code})\n--- STDOUT ---\n${execErr.stdout}\n--- STDERR ---\n${execErr.stderr}\n--- ERROR ---\n${execErr.message}`;
            }

            if (cmdOutput.length > 2500) {
              cmdOutput = cmdOutput.substring(0, 2500) + "\n\n... [SYSTEM WARNING: OUTPUT TRUNCATED]. The file is too large to display. Please write a script to process this data in the background and save it to a file, rather than printing it to the terminal.";
            }

            console.log(`[Agent] Output: ${cmdOutput.substring(0, 100)}...`);
            res.write(`data: ${JSON.stringify({ type: "terminal_output", output: cmdOutput })}\n\n`);

            // Add to history and continue loop
            currentHistory.push({ role: "assistant", content: JSON.stringify(parsed) });
            currentHistory.push({ role: "user", content: `Command Output:\n${cmdOutput}` });
          } else {
            // Tool is "none", task finished
            break;
          }
        } catch (err: any) {
          console.error("[Agent Loop Error]", err);
          res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          break;
        }
      }

      res.write("data: [DONE]\n\n");
      res.end();

    } catch (error: any) {
      console.error("Agent API error:", error);
      // Ensure we send errors via SSE since headers are likely already set
      res.write(`data: ${JSON.stringify({ error: error.message || "Internal server error" })}\n\n`);
      res.write("data: [DONE]\n\n");
      res.end();
    }
  });

  // API Route for Git Push (Android Builder)
  apiRouter.post("/git-push", async (req, res) => {
    try {
      const { framework, username, repo, token } = req.body;
      
      const gitUser = username || process.env.GITHUB_USERNAME;
      const gitRepo = repo || process.env.GITHUB_REPO;
      const gitToken = token || process.env.GITHUB_TOKEN;

      if (!gitUser || !gitRepo || !gitToken) {
        return res.status(400).json({ error: "Missing GitHub credentials (Username, Repo, or Token)." });
      }

      const selectedFramework = framework || "flutter";
      console.log(`[GitPush] Starting push for ${selectedFramework} to ${gitUser}/${gitRepo}`);

      // 1. Ensure .github/workflows directory exists
      const workflowDir = path.join(process.cwd(), ".github", "workflows");
      if (!fs.existsSync(workflowDir)) {
        fs.mkdirSync(workflowDir, { recursive: true });
      }

      // 2. Generate the correct workflow file
      const workflowPath = path.join(workflowDir, "android-build.yml");
      let workflowContent = "";

      if (selectedFramework === "flutter") {
        workflowContent = `name: Flutter Android Build
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.13.0'
          channel: 'stable'
      - name: Install dependencies
        run: flutter pub get
      - name: Build APK
        run: flutter build apk --release
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: build/app/outputs/flutter-apk/app-release.apk
`;
      } else {
        workflowContent = `name: Native Android Build
on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew
      - name: Build with Gradle
        run: ./gradlew assembleRelease
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: release-apk
          path: app/build/outputs/apk/release/app-release.apk
`;
      }

      fs.writeFileSync(workflowPath, workflowContent);
      console.log(`[GitPush] Workflow file generated at ${workflowPath}`);

      // 3. Execute Git Commands
      // Ensure we have the correct owner/repo format
      const repoPath = gitRepo.includes("/") ? gitRepo : `${gitUser}/${gitRepo}`;

      const remoteUrl = `https://${gitUser}:${gitToken}@github.com/${repoPath}.git`;

      // Clean up previous git state to avoid pushing old commits with secrets
      try {
        if (fs.existsSync(path.join(process.cwd(), ".git"))) {
          await execPromise("rm -rf .git");
          console.log("[GitPush] Cleaned up existing .git directory");
        }
      } catch (err) {
        console.warn("[GitPush] Failed to clean .git directory:", err);
      }

      const commands = [
        "git init",
        "git config user.email 'aura-ai@builder.com'",
        "git config user.name 'Aura AI Builder'",
        "git add .",
        'git commit -m "Automated build push via Aura-AI Builder"',
        "git branch -M main",
        `git remote add origin ${remoteUrl} || git remote set-url origin ${remoteUrl}`,
        "git push -u origin main --force"
      ];

      for (const cmd of commands) {
        try {
          // Use a special check to avoid logging the token if the remote command fails
          await execPromise(cmd, { timeout: 60000 });
        } catch (err: any) {
          const sanitizedError = err.message.replace(gitToken, "****");
          console.error(`[GitPush] Command failed: ${cmd.includes(gitToken) ? "git push (with token)" : cmd}`);
          
          if (sanitizedError.toLowerCase().includes("authentication failed") || sanitizedError.includes("401") || sanitizedError.includes("403")) {
            return res.status(401).json({ error: "Failed to authenticate with GitHub. Please check your Token and Username permissions." });
          }
          
          throw new Error(sanitizedError);
        }
      }

      res.status(200).json({ message: "Successfully pushed to GitHub! Your Android build should start shortly in Actions." });

    } catch (error: any) {
      console.error("[GitPush] Global error:", error.message);
      res.status(500).json({ error: error.message || "Git push failed." });
    }
  });

  // API Route for Build Status (GitHub Actions Polling)
  apiRouter.post("/build-status", async (req, res) => {
    try {
      const { username, repo, token } = req.body;
      
      const gitUser = username || process.env.GITHUB_USERNAME;
      let gitRepo = repo || process.env.GITHUB_REPO;
      const gitToken = token || process.env.GITHUB_TOKEN;

      if (!gitUser || !gitRepo || !gitToken) {
        return res.status(400).json({ error: "Missing GitHub credentials." });
      }

      // Ensure we have the correct owner/repo format
      const repoPath = gitRepo.includes("/") ? gitRepo : `${gitUser}/${gitRepo}`;

      // 1. Fetch the most recent workflow run
      const runsUrl = `https://api.github.com/repos/${repoPath}/actions/runs?per_page=1`;
      const runsResponse = await fetch(runsUrl, {
        headers: {
          'Authorization': `Bearer ${gitToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Aura-AI-Builder'
        }
      });

      if (!runsResponse.ok) {
        throw new Error(`GitHub API error: ${runsResponse.statusText}`);
      }

      const runsData: any = await runsResponse.json();
      if (!runsData.workflow_runs || runsData.workflow_runs.length === 0) {
        return res.json({ status: "no_runs", message: "No workflow runs found." });
      }

      const latestRun = runsData.workflow_runs[0];
      const result: any = {
        id: latestRun.id,
        status: latestRun.status,
        conclusion: latestRun.conclusion,
        run_html_url: latestRun.html_url,
        created_at: latestRun.created_at,
        updated_at: latestRun.updated_at
      };

      // 2. Handle completed runs
      if (latestRun.status === "completed") {
        if (latestRun.conclusion === "success") {
          // Fetch artifacts
          const artifactsUrl = latestRun.artifacts_url;
          const artResponse = await fetch(artifactsUrl, {
            headers: {
              'Authorization': `Bearer ${gitToken}`,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Aura-AI-Builder'
            }
          });
          
          if (artResponse.ok) {
            const artData: any = await artResponse.json();
            if (artData.artifacts && artData.artifacts.length > 0) {
              result.artifact_url = `https://github.com/${repoPath}/actions/runs/${latestRun.id}/artifacts/${artData.artifacts[0].id}`;
              result.artifact_name = artData.artifacts[0].name;
            }
          }
          // Default to run page if no specific artifact link found
          if (!result.artifact_url) {
            result.artifact_url = latestRun.html_url;
          }
        } else if (latestRun.conclusion === "failure") {
          result.failure_reason = "GitHub Action Failed. Check logs for details.";
        }
      }

      res.json(result);

    } catch (error: any) {
      console.error("[BuildStatus] error:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Handle unmatched API routes
  apiRouter.all("*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Mount the API Router
  app.use("/api", apiRouter);

  // Serve uploads folder statically - ensure it exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadDir));

  // Serve Vite in development, static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Check if dist exists, if not, we might be in a state where build hasn't run
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res, next) => {
        // Only serve index.html for GET requests that are not API calls
        if (req.method === "GET" && !req.path.startsWith("/api")) {
          res.sendFile(path.join(distPath, "index.html"));
        } else {
          next();
        }
      });
    }
  }

  // Handle unmatched routes for API with JSON error
  app.use("/api/*", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("[Server Error]", err);
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
