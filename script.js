const socket = io();
const chat = document.getElementById("chat");
const joinButton = document.getElementById("joinButton");
const composer = document.getElementById("composer");
const messageInput = document.getElementById("messageInput");
const nameInput = document.getElementById("nameInput");
const roomInput = document.getElementById("roomInput");
const passwordInput = document.getElementById("passwordInput");

let currentRoom = "general";
let joinedRoom = false;
const savedName = localStorage.getItem("chatUserName") || "Guest";
const savedRoom = localStorage.getItem("chatRoom") || "general";
const savedPassword = localStorage.getItem("chatRoomPassword") || "";

nameInput.value = savedName;
roomInput.value = savedRoom;
passwordInput.value = savedPassword;

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
  const password = passwordInput.value.trim();

  if (!socket.connected) {
    return;
  }

  if (joinedRoom && currentRoom === room && nameInput.value.trim() === name) {
    return;
  }

  currentRoom = room;
  localStorage.setItem("chatUserName", name);
  localStorage.setItem("chatRoom", room);
  localStorage.setItem("chatRoomPassword", password);

  chat.innerHTML = "";
  joinedRoom = true;
  socket.emit("join", { name, room, password });
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
  messageInput.value = "";
});

socket.on("history", (entries) => {
  chat.innerHTML = "";

  entries.forEach((entry) => {
    const senderName = entry.sender || "Guest";
    const isUser = senderName === (nameInput.value.trim() || "Guest");
    addMessage(
      entry.text,
      isUser ? "user" : "bot",
      `${senderName} • ${entry.time}`,
    );
  });
});

socket.on("message", ({ sender, text, time }) => {
  const isUser = sender === (nameInput.value.trim() || "Guest");
  addMessage(text, isUser ? "user" : "bot", `${sender} • ${time}`);
});

socket.on("system", (message) => {
  addMessage(message, "system");
});

socket.on("auth_error", (message) => {
  addMessage(message, "system");
  chat.scrollTop = chat.scrollHeight;
});

socket.on("connect", () => {
  if (savedName || savedRoom) {
    joinRoom();
  }
});

addMessage("Choose a name and join a room to start chatting.", "system");
