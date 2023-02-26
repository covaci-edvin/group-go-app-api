const Group = require('../models/groupModel');
const factory = require('./handlerController');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const User = require('../models/userModel');
const Email = require('../utils/email');

exports.getAllGroups = factory.getAll(Group);

exports.getGroup = factory.getOne(Group);

exports.setAdminId = (req, res, next) => {
  req.body.members = req.user.id;
  req.body.admin = req.user.id;
  next();
};

exports.createGroup = factory.createOne(Group);

exports.deleteGroup = factory.deleteOne(Group);

exports.updateGroup = factory.updateOne(Group);

exports.addGroupMember = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide an user email!'), 400);
  }
  //check if user exists in db
  const user = await User.findOne({ email }).select('email name');
  const groupId = await Group.findById(req.params.id);
  const currentUser = await User.findById(req.user.id);

  const url = `${req.protocol}://${req.get('host')}/signup`;
  if (!user) {
    //TODO: send sign up link email email
    await new Email(currentUser, url, groupId.name, email).sendJoinGroupGo();
    return next(new AppError('User with this email does not exist', 400));
  }

  if (groupId.members.some((member) => member._id.equals(user._id))) {
    return next(
      new AppError(
        `This user is already a member of the groupId: ${groupId.name}`
      )
    );
  }
  groupId.members.push(user);
  //TODO: send "successfully added to the groupId" email
  await new Email(user, url, groupId.name).sendAddedToGroup();
  await groupId.save();

  res.status(200).json({
    status: 'success',
    data: {
      groupId,
    },
  });
});

exports.removeGroupMember = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const userId = await User.findOne({ email }).select('id');
  const groupId = await Group.findById(req.params.id);
  const index = groupId.members.findIndex((member) => member.equals(userId));

  if (index === -1) {
    return next(
      new AppError(`This user does not exist in the group: ${groupId.name}`)
    );
  }

  groupId.members.splice(index, 1);
  await groupId.save();

  res.status(202).json({
    status: 'success',
    data: null,
  });
});

// exports.createGroup = catchAsync(async (req, res, next) => {
//   req.body.members = req.user.id;
//   req.body.admin = req.user.id;
//   console.log(req.user);
//   const newGroup = await Group.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       group: newGroup,
//     },
//   });
// });

// exports.getUserGroups = catchAsync(async (req, res, next) => {});
