const socket = io();
const chat = document.getElementById("chat");
const joinButton = document.getElementById("joinButton");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");

let currentRoom = "general";

function addMessage(text, sender = "system", meta = "") {
  const message = document.createElement("div");
  message.className = `message ${sender}`;

  if (meta) {
    const metaEl = document.createElement("span");
    metaEl.className = "message-meta";
    metaEl.textContent = meta;
    message.appendChild(metaEl);
  }

  const content = document.createElement("div");
  content.textContent = text;
  message.appendChild(content);
  chat.appendChild(message);
  chat.scrollTop = chat.scrollHeight;
}

function joinRoom() {
  const name = nameInput.value.trim() || "Guest";
  const room = roomInput.value.trim() || "general";

  currentRoom = room;
  socket.emit("join", { name, room });
  addMessage(`You joined room "${room}".`, "system");
  messageInput.focus();
}

joinButton.addEventListener("click", joinRoom);

roomInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    joinRoom();
  }
});

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    joinRoom();
  }
});

composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();

  if (!text) {
    return;
  }

  socket.emit("message", { room: currentRoom, text });
  addMessage(text, "user", "You");
  messageInput.value = "";
});

socket.on("message", ({ sender, text, time }) => {
  addMessage(text, "bot", `${sender} • ${time}`);
});

socket.on("system", (message) => {
  addMessage(message, "system");
});

addMessage("Choose a name and join a room to start chatting.", "system");
