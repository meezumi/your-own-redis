const net = require("net");

console.log("Logs from your program will appear here!");

// In-memory data store
const store = {};

// Parse RESP protocol
function parseRESP(data) {
  const lines = data.toString().split("\r\n");
  const result = [];
  let i = 0;

  function parse() {
    if (i >= lines.length) return null;

    const line = lines[i++];
    if (!line) return null;

    const type = line[0];

    if (type === "*") {
      // Array
      const count = parseInt(line.slice(1));
      const arr = [];
      for (let j = 0; j < count; j++) {
        arr.push(parse());
      }
      return arr;
    } else if (type === "$") {
      // Bulk string
      const length = parseInt(line.slice(1));
      if (length === -1) return null;
      const str = lines[i++];
      return str;
    } else if (type === "+") {
      // Simple string
      return line.slice(1);
    } else if (type === ":") {
      // Integer
      return parseInt(line.slice(1));
    } else if (type === "-") {
      // Error
      return new Error(line.slice(1));
    }
  }

  return parse();
}

// Parse RESP and track consumed bytes
function parseRESPFromBuffer(buffer) {
  let pos = 0;

  function readUntilCRLF() {
    const idx = buffer.indexOf("\r\n", pos);
    if (idx === -1) return null;
    const line = buffer.slice(pos, idx);
    pos = idx + 2;
    return line;
  }

  function parse() {
    const line = readUntilCRLF();
    if (line === null) return null;

    const type = line[0];

    if (type === "*") {
      const count = parseInt(line.slice(1));
      const arr = [];
      for (let j = 0; j < count; j++) {
        const item = parse();
        if (item === null) return null;
        arr.push(item);
      }
      return arr;
    } else if (type === "$") {
      const length = parseInt(line.slice(1));
      if (length === -1) return null;
      
      if (pos + length + 2 > buffer.length) return null;
      
      const str = buffer.slice(pos, pos + length).toString();
      pos += length + 2; // +2 for \r\n
      return str;
    } else if (type === "+") {
      return line.slice(1);
    } else if (type === ":") {
      return parseInt(line.slice(1));
    } else if (type === "-") {
      return new Error(line.slice(1));
    }
  }

  const parsed = parse();
  if (parsed === null) return null;

  return { parsed, consumed: pos };
}

// Format RESP response
function formatRESP(value) {
  if (value === null) {
    return "$-1\r\n";
  } else if (typeof value === "string") {
    return `$${value.length}\r\n${value}\r\n`;
  } else if (typeof value === "number") {
    return `:${value}\r\n`;
  } else if (value instanceof Error) {
    return `-${value.message}\r\n`;
  } else if (Array.isArray(value)) {
    let resp = `*${value.length}\r\n`;
    for (const item of value) {
      resp += formatRESP(item);
    }
    return resp;
  } else {
    return `+${value}\r\n`;
  }
}

// Handle commands
function handleCommand(cmd) {
  if (!Array.isArray(cmd) || cmd.length === 0) {
    return new Error("ERR invalid command");
  }

  const command = cmd[0].toUpperCase();
  const args = cmd.slice(1);

  switch (command) {
    case "PING":
      return args.length > 0 ? args[0] : "PONG";

    case "ECHO":
      if (args.length === 0) {
        return new Error("ERR wrong number of arguments for 'echo' command");
      }
      return args[0];

    case "SET":
      if (args.length < 2) {
        return new Error("ERR wrong number of arguments for 'set' command");
      }
      const key = args[0];
      const value = args[1];
      store[key] = value;
      return "OK";

    case "GET":
      if (args.length === 0) {
        return new Error("ERR wrong number of arguments for 'get' command");
      }
      return store[args[0]] || null;

    case "DEL":
      if (args.length === 0) {
        return new Error("ERR wrong number of arguments for 'del' command");
      }
      let deleteCount = 0;
      for (const k of args) {
        if (k in store) {
          delete store[k];
          deleteCount++;
        }
      }
      return deleteCount;

    case "EXISTS":
      if (args.length === 0) {
        return new Error("ERR wrong number of arguments for 'exists' command");
      }
      let existsCount = 0;
      for (const k of args) {
        if (k in store) {
          existsCount++;
        }
      }
      return existsCount;

    case "KEYS":
      if (args.length === 0) {
        return new Error("ERR wrong number of arguments for 'keys' command");
      }
      const pattern = args[0];
      const keys = Object.keys(store);
      
      if (pattern === "*") {
        return keys;
      }
      
      // Simple pattern matching: * matches any characters
      const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
      return keys.filter(k => regex.test(k));

    case "DBSIZE":
      return Object.keys(store).length;

    default:
      return new Error(`ERR unknown command '${command}'`);
  }
}

const server = net.createServer((connection) => {
  let buffer = "";

  connection.on("data", (data) => {
    buffer += data.toString();

    // Process all complete commands in the buffer
    while (buffer.length > 0) {
      try {
        // Find the end of a complete RESP message
        const command = parseRESPFromBuffer(buffer);
        if (command === null) {
          // Incomplete command, wait for more data
          break;
        }

        const { parsed, consumed } = command;
        buffer = buffer.slice(consumed);

        const response = handleCommand(parsed);
        connection.write(formatRESP(response));
      } catch (err) {
        connection.write(formatRESP(new Error("ERR Protocol error")));
        buffer = "";
        break;
      }
    }
  });

  connection.on("error", (err) => {
    console.error("Connection error:", err);
  });
});

server.listen(6379, "127.0.0.1");
