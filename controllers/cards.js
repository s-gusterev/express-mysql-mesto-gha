const Card = require('../models/card');
const pool = require('../dbconn');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenError = require('../errors/ForbiddenError');

const createCard = (req, res, next) => {
  const { name, link } = req.body;

  pool.getConnection()
    .then((conn) => {
      const response = conn.query(
        'INSERT INTO cards (name, link, owner) VALUES(?, ?, ?)',
        [name, link, req.user.userId],
      );
      conn.release();
      return response;
    })
    .then((result) => result[0].insertId)
    .then((insertId) => {
      pool.getConnection()
        .then((conn) => {
          const card = conn.query(
            // eslint-disable-next-line quotes
            `SELECT cards.*,
             users.name AS user_name,
             users.avatar AS user_avatar,
             users.about AS user_about
             FROM cards JOIN users ON cards.owner = users.id WHERE cards.id = ?;`,
            [insertId],
          );
          conn.release();
          return card;
        })
        .then((card) => {
          res.json({
            id: card[0][0].id,
            name: card[0][0].name,
            link: card[0][0].link,
            createdAt: card[0][0].createdAt,
            owner: [{
              id: card[0][0].owner,
              name: card[0][0].user_name,
              avatar: card[0][0].user_avatar,
              about: card[0][0].user_about,
            }],
          });
        });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    })
    .catch(next);
};

// const createCard = (req, res, next) => {
//   const { name, link } = req.body;

//   Card.create({ name, link, owner: req.user._id })
//     .then((card) => { res.send({ data: card }); })
//     .catch((err) => {
//       if (err.name === 'ValidationError') {
//         throw new BadRequestError('Переданы некорректные данные при создании карточки');
//       } else {
//         next(err);
//       }
//     })
//     .catch(next);
// };

const getCard = (req, res, next) => {
  Card.find({})
    .then((card) => { res.send({ data: card }); })
    .catch((err) => { next(err); });
};

const getCardId = (req, res, next) => {
  Card.findById(req.params.id)
    .then((card) => {
      if (!card) {
        throw new NotFoundError('Карточка с указанным id не найдена');
      } else {
        res.send({ data: card });
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Некорректно указан id карточки');
      } else {
        next(err);
      }
    })
    .catch(next);
};

const deleteCard = (req, res, next) => {
  Card.findById(req.params.cardId)
    .then((card) => {
      if (!card) {
        throw new NotFoundError('Карточка с указанным id не найдена');
      }
      if (card.owner.toString() === req.user._id) {
        return Card.findByIdAndDelete(req.params.cardId)
          .then(() => {
            res.status(200).send({ message: 'Карточка успешно удалена' });
          });
      }
      throw new ForbiddenError('Невозможно удалить карточку другого пользователя');
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Некорректно указан id карточки');
      }
      next(err);
    })
    .catch(next);
};

const likeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $addToSet: { likes: req.user._id } }, { new: true })
    .then((card) => {
      if (!card) {
        throw new NotFoundError('Передан несуществующий _id карточки');
      } else {
        res.send({ data: card });
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные для постановки лайка');
      }
      next(err);
    })
    .catch(next);
};

const dislikeCard = (req, res, next) => {
  Card.findByIdAndUpdate(req.params.cardId, { $pull: { likes: req.user._id } }, { new: true })
    .then((card) => {
      if (!card) {
        throw new NotFoundError('Передан несуществующий _id карточки');
      } else {
        res.send({ data: card });
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        throw new BadRequestError('Переданы некорректные данные для снятия лайка');
      }
      next(err);
    })
    .catch(next);
};

module.exports = {
  createCard,
  getCard,
  getCardId,
  likeCard,
  dislikeCard,
  deleteCard,
};
