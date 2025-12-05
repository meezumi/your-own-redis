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

    default:
      return new Error(`ERR unknown command '${command}'`);
  }
}

const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    try {
      const command = parseRESP(data);
      const response = handleCommand(command);
      connection.write(formatRESP(response));
    } catch (err) {
      connection.write(formatRESP(new Error("ERR Protocol error")));
    }
  });

  connection.on("error", (err) => {
    console.error("Connection error:", err);
  });
});

server.listen(6379, "127.0.0.1");
