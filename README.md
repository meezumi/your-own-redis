# Your Own Redis

A lightweight Redis clone implementation in JavaScript/Node.js, created as a learning project to understand how Redis works under the hood.

## What It Does

This project implements a functional Redis-like in-memory data store with support for basic commands and the RESP (Redis Serialization Protocol) protocol. It allows you to:

- Store and retrieve key-value pairs with `SET` and `GET`
- Check key existence with `EXISTS`
- Delete keys with `DEL`
- List keys with pattern matching using `KEYS`
- Get database statistics with `DBSIZE`
- Test connectivity with `PING` and `ECHO`

The server listens on `127.0.0.1:6379` (default Redis port) and can be accessed using standard Redis clients like `redis-cli`.

## Why It's Created

This project is built as part of the [CodeCrafters Redis Challenge](https://codecrafters.io/challenges/redis), designed to teach:

- **Network Programming** - Building a TCP server in Node.js
- **Protocol Implementation** - Understanding and implementing RESP (Redis Serialization Protocol)
- **In-Memory Data Structures** - Managing data in memory
- **Command Parsing** - Parsing and executing commands
- **Buffer Management** - Handling multiple commands and incomplete data

This hands-on approach helps developers understand how databases work at a fundamental level.

## Prerequisites

- Node.js 21+ (as specified in the CodeCrafters challenge)
- redis-cli (optional, for testing)

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/meezumi/your-own-redis.git
   cd your-own-redis/codecrafters-redis-javascript
   ```

2. **Make the script executable:**
   ```bash
   chmod +x your_program.sh
   ```

3. **Start the Redis server:**
   ```bash
   ./your_program.sh
   ```

   Or run directly with Node:
   ```bash
   node app/main.js
   ```

   You should see:
   ```
   Logs from your program will appear here!
   ```

## Usage

Once the server is running, you can interact with it using `redis-cli` in another terminal:

### Basic Commands

```bash
# Test connectivity
redis-cli ping
# Output: PONG

# Echo a message
redis-cli echo "Hello, Redis!"
# Output: Hello, Redis!

# Store and retrieve data
redis-cli set mykey "myvalue"
redis-cli get mykey
# Output: myvalue

# Check if key exists
redis-cli exists mykey
# Output: (integer) 1

# Delete a key
redis-cli del mykey
redis-cli exists mykey
# Output: (integer) 0

# Get database size
redis-cli set key1 "value1"
redis-cli set key2 "value2"
redis-cli dbsize
# Output: (integer) 2

# List all keys
redis-cli keys "*"
# Output: key1, key2

# Pattern matching
redis-cli keys "key*"
# Output: key1, key2
```

### Using netcat (alternative to redis-cli)

```bash
echo -e "PING\r" | nc localhost 6379
# Output: +PONG
```

## Architecture

### File Structure

```
your-own-redis/
├── codecrafters-redis-javascript/
│   ├── app/
│   │   └── main.js          # Main Redis server implementation
│   ├── your_program.sh      # Entry point script
│   ├── package.json         # Node.js dependencies
│   └── codecrafters.yml     # CodeCrafters configuration
└── README.md                # This file
```

### Key Components

1. **RESP Parser** - Parses incoming Redis protocol messages
2. **RESP Formatter** - Formats responses back to RESP protocol
3. **Command Handler** - Executes commands and returns results
4. **In-Memory Store** - JavaScript object storing key-value pairs
5. **Connection Handler** - Manages client connections and buffers

## Implemented Commands

| Command | Usage | Description |
|---------|-------|-------------|
| PING | `PING [message]` | Returns PONG or echoes message |
| ECHO | `ECHO message` | Echoes the given string |
| SET | `SET key value` | Sets a key to hold the string value |
| GET | `GET key` | Gets the value of a key |
| DEL | `DEL key [key ...]` | Deletes one or more keys |
| EXISTS | `EXISTS key [key ...]` | Checks if keys exist |
| KEYS | `KEYS pattern` | Finds all keys matching pattern (* for all) |
| DBSIZE | `DBSIZE` | Returns the number of keys in the database |

## Future Enhancements

- [ ] Data structure support (Lists, Sets, Hashes, Sorted Sets)
- [ ] Key expiration (EXPIRE, TTL)
- [ ] Transactions (MULTI, EXEC)
- [ ] Persistence (RDB snapshots, AOF logs)
- [ ] Pub/Sub functionality
- [ ] Additional string operations (APPEND, STRLEN, GETRANGE)

## Testing

The project follows the CodeCrafters challenge stages. Submit your changes:

```bash
git add .
git commit -m "Stage description"
git push origin master
```

Test output will be streamed to your terminal from CodeCrafters.

## Learning Resources

- [Redis Protocol Specification](https://redis.io/topics/protocol)
- [Node.js Net Module Documentation](https://nodejs.org/api/net.html)
- [CodeCrafters Redis Challenge](https://codecrafters.io/challenges/redis)

## License

This project is part of the CodeCrafters challenge and is created for educational purposes.

---

**Happy coding!** 🚀
