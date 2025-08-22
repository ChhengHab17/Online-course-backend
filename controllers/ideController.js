import fs from 'fs';
import path from "path";
import { spawn } from "child_process";
import { connections, processes } from '../index.js';

export const runCode = (req, res) => {
  const { language, code, clientId } = req.body;
  
  const dockerImages = {
    php: { image: "code-runner-php", file: "code.php", cmd: ["php", "code.php"] },
    python: { image: "code-runner-python", file: "code.py", cmd: ["python", "code.py"] },
    node: { image: "code-runner-node", file: "code.js", cmd: ["node", "code.js"] },
    java: {
      image: "code-runner-java",
      file: "Main.java",
      cmd: ["sh", "-c", "javac Main.java && java Main"]
    },
    cpp: { 
      image: "gcc:latest", 
      file: "code.cpp", 
      cmd: ["sh", "-c", "g++ code.cpp -o code && stdbuf -oL -eL ./code"]
    }
  };

  const tempDir = path.join(process.cwd(), "temp");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

  if (!dockerImages[language]) {
    return res.status(400).json({ error: "Unsupported language" });
  }

  const filePath = path.join(tempDir, dockerImages[language].file);
  fs.writeFileSync(filePath, code);

  // Build docker run command with proper command structure
  const dockerArgs = [
    "run",
    "--rm",
    "-i",
    "-v", `${tempDir}:/app`,
    "-w", "/app",
    dockerImages[language].image,
    ...dockerImages[language].cmd  // spread the command array
  ];

  const proc = spawn("docker", dockerArgs, {
    stdio: ['pipe', 'pipe', 'pipe'], // stdin, stdout, stderr
    shell: false,
    detached: false
  });

  processes.set(clientId, proc);
  const ws = connections.get(clientId);

  if (ws) ws.send(JSON.stringify({ type: "start" }));

  // Set a timeout for processes (30 seconds)
  const timeout = setTimeout(() => {
    if (processes.has(clientId)) {
      proc.kill('SIGTERM');
      processes.delete(clientId);
      if (ws) ws.send(JSON.stringify({ 
        type: "error", 
        data: "Process timed out after 30 seconds" 
      }));
      if (ws) ws.send(JSON.stringify({ type: "close", code: -1 }));
    }
  }, 30000);

  // Handle stdout
  proc.stdout.on("data", (chunk) => {
    if (ws) ws.send(JSON.stringify({
      type: "stdout",
      data: chunk.toString()
    }));
  });

  // Handle stderr
  proc.stderr.on("data", (chunk) => {
    if (ws) ws.send(JSON.stringify({ 
      type: "stderr", 
      data: chunk.toString() 
    }));
  });

  // Handle process exit
  proc.on("close", (code) => {
    clearTimeout(timeout); // Clear timeout when process closes
    processes.delete(clientId);
    if (ws) ws.send(JSON.stringify({ 
      type: "close", 
      code 
    }));
  });

  // Handle process errors
  proc.on("error", (error) => {
    clearTimeout(timeout); // Clear timeout on error
    processes.delete(clientId);
    if (ws) ws.send(JSON.stringify({ 
      type: "error", 
      data: error.message 
    }));
  });

  res.json({ status: "started" });
};

// Function to handle user input from WebSocket
export const handleUserInput = (clientId, input) => {
  const proc = processes.get(clientId);
  if (proc && proc.stdin && proc.stdin.writable) {
    proc.stdin.write(input);
  }
};

// Function to send input to process
export const sendInput = (req, res) => {
  const { clientId, input } = req.body;
  const proc = processes.get(clientId);
  
  if (proc && proc.stdin && proc.stdin.writable) {
    // For C/C++ programs, ensure we send the input with proper line ending
    const inputToSend = input.endsWith('\n') ? input : input + '\n';
    proc.stdin.write(inputToSend);
    proc.stdin.end(); // End stdin after sending input for C programs
    res.json({ status: "input_sent" });
  } else {
    res.status(400).json({ error: "Process not found or not writable" });
  }
};

// Function to kill a running process
export const killProcess = (req, res) => {
  const { clientId } = req.body;
  const proc = processes.get(clientId);
  
  if (proc) {
    proc.kill('SIGTERM');
    processes.delete(clientId);
    res.json({ status: "process_killed" });
  } else {
    res.status(400).json({ error: "Process not found" });
  }
};