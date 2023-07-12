const usersrouter = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const getUserInfo = require('../controllers/users/getUserInfo');
const getUserId = require('../controllers/users/getUserId');
const patchUserProfile = require('../controllers/users/patchUserProfile');
const patchUserAvatar = require('../controllers/users/patchUserAvatar');

usersrouter.get('/me', getUserInfo);

usersrouter.get('/:id', celebrate({
  params: Joi.object().keys({
    id: Joi.string().max(11),
  }),
}), getUserId);

// usersrouter.get('/:id', celebrate({
//   params: Joi.object().keys({
//     id: Joi.string().hex().length(24),
//   }),
// }), getUserId);

usersrouter.patch('/me', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
  }),
}), patchUserProfile);

usersrouter.patch('/me/avatar', celebrate({
  body: Joi.object().keys({
    avatar: Joi.string().regex(/^((http|https):\/\/)?(www\.)?([A-Za-zА0-9]{1}[A-Za-zА0-9-]*\.?)*\.{1}[A-Za-zА0-9-]{2,}(\/([\w#!:.?+=&%@!\-/])*)?/),
  }),
}), patchUserAvatar);

module.exports = usersrouter;
