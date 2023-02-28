const socketIo = require('socket.io');
const catchAsync = require('../utils/catchAsync');
const Group = require('../models/groupModel');

const locationsMap = new Map();
let io;
exports.socketIoController = function (server) {
  io = socketIo(server);

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
      io.to(groupId).emit('location-update', locationData);
    });
  });
  return io;
};

// exports.shareLocation = catchAsync(async (req, res, next) => {
//   const groupId = req.params.id;
//   const { userId, location } = req.body;

//   // Store the geolocation data in a map for the group
//   // The map key is a combination of the group id and the user id

//   locationsMap.set(`${groupId}-${userId}`, location);

//   //Broadcast the updated locations map to the group

//   const group = await Group.findById(groupId);
//   const { members } = group;
//   const locationData = {};
//   members.forEach((member) => {
//     const location = locationsMap.get(`${groupId}-${member}`);
//     if (location) {
//       locationData[member] = location;
//     }
//   });

//   io.to(groupId).emit('locations-update', locationData);

//   res.status(200).json({
//     status: 'success',
//   });
// });
