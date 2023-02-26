const express = require('express');
const groupController = require('../controllers/groupController');
const authController = require('../controllers/authController');
const socketController = require('../controllers/socketController');

const router = express.Router({ mergeParams: true });

router.use(authController.protect);

router
  .route('/')
  .get(authController.restrictTo('admin'), groupController.getAllGroups)
  .post(groupController.setAdminId, groupController.createGroup);

router
  .route('/:id')
  .get(groupController.getGroup)
  .delete(groupController.deleteGroup)
  .patch(groupController.updateGroup);

router
  .route('/:id/members')
  .post(groupController.addGroupMember)
  .delete(groupController.removeGroupMember);

router.route('/:id/share-location').post(socketController.shareLocation);

module.exports = router;
