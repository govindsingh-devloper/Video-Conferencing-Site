const { Server } = require('socket.io');

let connections = {};
let messages = {};
let timeOnline = {};

const connectToSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("SOMETHING CONNECTED");

    // When a user joins a call
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      // Emit the 'user-joined' event to all users in the room
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit("user-joined", socket.id, connections[path]);
      }

      // Emit the updated list of users to the new user
      io.to(socket.id).emit("users-in-call", connections[path]);

      // Send past messages to the new user
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit("chat-message", messages[path][a]['data'],
            messages[path][a]['sender'], messages[path][a]['socket-id-sender']);
        }
      }
    });

    // Handle signaling messages for peer-to-peer communication
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

    // Handle chat messages from users
    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections)
        .reduce(([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }
          return [room, isFound];
        }, ['', false]);

      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }
        messages[matchingRoom].push({ 'sender': sender, "data": data, "socket-id-sender": socket.id });
        console.log("message", matchingRoom, ":", sender, data);

        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // Handle user disconnections
    socket.on("disconnect", () => {
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());
      var key;

      for (const [k, v] of Object.entries(connections)) {
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;

            // Emit 'user-left' event to all users in the room
            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit('user-left', socket.id);
            }

            // Remove user from the room
            var index = connections[key].indexOf(socket.id);
            connections[key].splice(index, 1);

            // Clean up the room if it's empty
            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });

  return io;
};

module.exports = connectToSocket;
