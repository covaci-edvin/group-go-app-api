const catchAsync = require('../utils/catchAsync');
const Group = require('../models/groupModel');

// Create a socket controller that will allow users to share their location with other members of the group

exports.shareLocation = catchAsync(async (req, res, next) => {});
//Write a
// const socketIo = require('socket.io');

// exports.shareLocation = catchAsync(async (req, res, next) => {
//   const groupId = await Group.findById(req.params.id);
// });

// io.on('connection', (socket) => {
//   console.log(`Socket ${socket.id} connected!`);

//   socket.on('join-group', (groupId) => {
//     console.log(`Socket ${socket.id} joined group ${groupId}`);
//     socket.join(groupId);
//   });

//   socket.on('disconnect', () => {
//     console.log(`Socket ${socket.id} disconnected`);
//     socket.leaveAll();
//   });
// });
