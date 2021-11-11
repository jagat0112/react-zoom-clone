const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.emit("me", socket.id);

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser1", {
      signal: data.signal,
      from: data.from,
    });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", { signal: data.signal });
  });
});

httpServer.listen(5001, () => console.log("Server Started at 5000....."));
