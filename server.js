const express = require("express");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const HISTORY_PATH = path.join(__dirname, "chat-history.json");

let roomHistory = {};

function loadHistory() {
  try {
    const file = fs.readFileSync(HISTORY_PATH, "utf8");
    const parsed = JSON.parse(file);
    roomHistory = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    roomHistory = {};
  }
}

function saveHistory() {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(roomHistory, null, 2));
}

function getRoomHistory(room) {
  const roomMessages = roomHistory[room] || [];
  return roomMessages.slice(-100);
}

function addRoomMessage(room, message) {
  const roomMessages = roomHistory[room] || [];
  roomMessages.push(message);
  if (roomMessages.length > 200) {
    roomMessages.shift();
  }
  roomHistory[room] = roomMessages;
  saveHistory();
}

loadHistory();

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join", ({ name, room }) => {
    const safeName =
      String(name || "Guest")
        .trim()
        .slice(0, 20) || "Guest";
    const safeRoom =
      String(room || "general")
        .trim()
        .slice(0, 30) || "general";

    socket.data.name = safeName;
    socket.data.room = safeRoom;

    socket.join(safeRoom);
    socket.emit("history", getRoomHistory(safeRoom));
    socket.emit("system", `You joined room "${safeRoom}".`);
    socket.to(safeRoom).emit("system", `${safeName} joined the chat.`);
  });

  socket.on("message", ({ room, text }) => {
    const safeText = String(text || "").trim();
    const safeRoom = String(room || "general").trim() || "general";

    if (!safeText) {
      return;
    }

    const message = {
      sender: socket.data.name || "Guest",
      text: safeText,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    addRoomMessage(safeRoom, message);
    io.to(safeRoom).emit("message", message);
  });

  socket.on("disconnect", () => {
    const room = socket.data.room;
    const name = socket.data.name;

    if (room && name) {
      socket.to(room).emit("system", `${name} left the chat.`);
    }

    console.log("A user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running on http://localhost:${PORT}`);
});
