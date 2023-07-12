const cardsrouter = require('express').Router();
const { celebrate, Joi } = require('celebrate');
const createCard = require('../controllers/cards/createCard');
const getCard = require('../controllers/cards/getCard');
const getCardId = require('../controllers/cards/getCardId');
const deleteCard = require('../controllers/cards/deleteCard');
const likeCard = require('../controllers/cards/likeCard');
const dislikeCard = require('../controllers/cards/dislikeCard');

cardsrouter.post('/', celebrate({
  body: Joi.object().keys({
    name: Joi.string().required().min(2).max(30),
    link: Joi.string().required().regex(/^((http|https):\/\/)?(www\.)?([A-Za-zА0-9]{1}[A-Za-zА0-9-]*\.?)*\.{1}[A-Za-zА0-9-]{2,}(\/([\w#!:.?+=&%@!\-/])*)?/),
  }),
}), createCard);

cardsrouter.get('/', getCard);

cardsrouter.get('/:id', celebrate({
  params: Joi.object().keys({
    id: Joi.string().max(11),
  }),
}), getCardId);

cardsrouter.delete('/:cardId', celebrate({
  params: Joi.object().keys({
    cardId: Joi.string().max(11),
  }),
}), deleteCard);

cardsrouter.put('/:cardId/likes', celebrate({
  params: Joi.object().keys({
    cardId: Joi.string().max(11),
  }),
}), likeCard);
cardsrouter.delete('/:cardId/likes', celebrate({
  params: Joi.object().keys({
    cardId: Joi.string().max(11),
  }),
}), dislikeCard);

module.exports = cardsrouter;
