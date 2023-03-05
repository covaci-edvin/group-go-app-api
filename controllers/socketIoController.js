const socketIo = require('socket.io');
const Group = require('../models/groupModel');

const locationsMap = new Map();

exports.socketIoController = function (server) {
  const io = socketIo(server);

  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected!`);

    // Join a room based on the group id
    socket.on('join-group', async (groupId) => {
      socket.join(groupId);
      console.log(`Socket ${socket.id} joined group ${groupId}`);
      // Fetch the group members and emit the list to the client
      const group = await Group.findById(groupId);
      const { members } = group;
      io.to(groupId).emit('members', members);

      // Emit the current location data to the client
      const locationData = {};
      members.forEach((member) => {
        const location = locationsMap.get(`${groupId}:${member}`);
        if (location) {
          locationData[member] = location;
        }
      });
      socket.emit('locations-update', locationData);
    });

    // Receive geolocation data from a client and broadcast it to the group
    socket.on('share-location', async (data) => {
      const { groupId, userId, location } = data;
      console.log(
        `Socket ${socket.id} shared location for user ${userId} in group ${groupId}: ${location}`
      );

      // Update the locations map for the group
      locationsMap.set(`${groupId}-${userId}`, location);

      // Broadcast the updated loocations map to the group
      const group = await Group.findById(groupId);
      const { members } = group;
      const locationData = {};

      members.forEach((member) => {
        const location = locationsMap.get(`${groupId}-${member}`);
        if (location) {
          locationData[member] = location;
        }
      });
      io.to(groupId).emit('locations-update', locationData);
    });
  });
  return io;
};
