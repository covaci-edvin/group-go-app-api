const mongoose = require('mongoose');
const AppError = require('../utils/appError');

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A group must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A group name must be less or equal than 40 characters'],
      minlength: [
        10,
        'A group name must have more or equal than 10 characters',
      ],
    },
    image: {
      type: String,
      default: 'default.jpg',
    },
    description: {
      type: String,
      trim: true,
    },
    members: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
    admin: { type: mongoose.Schema.ObjectId, ref: 'User' },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

groupSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'members',
    select: '-__v -groups',
  }).populate({ path: 'admin', select: 'name email photo' });
  next();
});

groupSchema.methods.addUserIdToMembers = async function (userId) {
  if (this.members.includes(userId))
    return new AppError('User already a member of this group');
};

const GroupModel = mongoose.model('Group', groupSchema);
const Group = mongoose.model('Group') || GroupModel;
module.exports = Group;
