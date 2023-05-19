const socketIo = require('socket.io');
const { promisify } = require('util');
const { instrument } = require('@socket.io/admin-ui');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');

exports.socketIoController = function (server) {
  const io = socketIo(server);

  io.use(async (socket, next) => {
    if (socket.handshake.auth.token) {
      const decoded = await promisify(jwt.verify)(
        socket.handshake.auth.token,
        process.env.JWT_SECRET
      );

      // 3) Check if user still exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next(
          new AppError('The use beloging to this token no longer exists', 401)
        );
      }

      // 4) Check if user changed password after the token was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(
          new AppError(
            'User recently changed password! Please log in again',
            401
          )
        );
      }
      next();
    } else {
      next(
        new AppError('You are not logged in! Please log in to get access', 401)
      );
    }
  });

  io.on('connection', (socket) => {
    console.log(`${socket.id} a user connected`);

    socket.on('disconnect', () => {
      console.log(`${socket.id} disconnected`);
    });

    socket.on(
      'send-invitation',
      (groupId, userName, groupName, destination, adminSocketId) => {
        socket
          .to(groupId)
          .emit(
            'receive-invitation',
            groupId,
            userName,
            groupName,
            destination,
            adminSocketId
          );
      }
    );

    socket.on('joined-group-route', (user, adminId) => {
      socket.to(adminId).emit('joined', user);
    });

    socket.on('leave-group-route', (userId, adminId) => {
      socket.to(adminId).emit('left', userId);
    });

    socket.on('group-route-started', (groupId) => {
      socket.to(groupId).emit('group-route-started', groupId);
    });

    socket.on('delete-group', (groupId) => {
      io.socketsLeave('groupId');
      console.log(`${groupId} cleared`);
    });

    socket.on('leave-group', (groupId) => {
      socket.leave(groupId);
      console.log(`${socket.id} left ${groupId}`);
    });

    socket.on('join-room', (groupId, groupName) => {
      socket.join(groupId);
      console.log(
        `${socket.id} connected to the room ${groupName} with the id`
      );
    });

    socket.on('broadcast-location', (groupId, origin, userId, color) => {
      socket.to(groupId).emit('location', origin, userId, color);
    });

    socket.on(
      'broadcast-response-location',
      (groupId, origin, userId, color) => {
        socket.to(groupId).emit('response-location', origin, userId, color);
      }
    );
  });

  instrument(io, { auth: false });
  return io;
};
// io.on('connection', (socket) => {
//   console.log(`Socket ${socket.id} connected!`);

//   // Join a room based on the group id
//   socket.on('join-group', async (groupId) => {
//     socket.join(groupId);
//     console.log(`Socket ${socket.id} joined group ${groupId}`);
//     // Fetch the group members and emit the list to the client
//     const group = await Group.findById(groupId);
//     const { members } = group;
//     io.to(groupId).emit('members', members);

//     // Emit the current location data to the client
//     const locationData = {};
//     members.forEach((member) => {
//       const location = locationsMap.get(`${groupId}:${member}`);
//       if (location) {
//         locationData[member] = location;
//       }
//     });
//     socket.emit('locations-update', locationData);
//   });

//   // Receive geolocation data from a client and broadcast it to the group
//   socket.on('share-location', async (data) => {
//     const { groupId, userId, location } = data;
//     console.log(
//       `Socket ${socket.id} shared location for user ${userId} in group ${groupId}: ${location}`
//     );

//     // Update the locations map for the group
//     locationsMap.set(`${groupId}-${userId}`, location);

//     // Broadcast the updated locations map to the group
//     const group = await Group.findById(groupId);
//     const { members } = group;
//     const locationData = {};

//     members.forEach((member) => {
//       const location = locationsMap.get(`${groupId}-${member}`);
//       if (location) {
//         locationData[member] = location;
//       }
//     });
//     io.to(groupId).emit('locations-update', locationData);
//   });
// });
