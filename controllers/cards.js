const pool = require('../dbconn');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const ForbiddenError = require('../errors/ForbiddenError');
const { requestCreateCardInsert, requestCreateCardSelect } = require('../utils/mysqlRequest');

const createCard = (req, res, next) => {
  const { name, link } = req.body;

  pool.getConnection()
    .then((conn) => {
      const response = conn.query(
        requestCreateCardInsert,
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
            requestCreateCardSelect,
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
            owner: {
              id: card[0][0].owner,
              name: card[0][0].user_name,
              avatar: card[0][0].user_avatar,
              about: card[0][0].user_about,
            },
            likes: [],
          });
        });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    })
    .catch(next);
};

const getCard = (req, res, next) => {
  pool.getConnection()
    .then((conn) => {
      const cards = conn.query(
      // eslint-disable-next-line quotes
        `SELECT cards.*,
          users.name AS user_name,
          users.avatar AS user_avatar,
          users.about AS user_about,
            IFNULL((SELECT CONCAT('[', 
              GROUP_CONCAT(
                  CONCAT('{',
                         '"user_id":', likes.user_id,
                         ',"name":"', REPLACE(users.name, '"', '\\"'),
                         '","avatar":"', REPLACE(users.avatar, '"', '\\"'),
                         '","about":"', REPLACE(users.about, '"', '\\"'),
                         '"}'
                        )
                  SEPARATOR ','
              ),
       ']')
         FROM likes
         JOIN users ON likes.user_id = users.id
         WHERE likes.card_id = cards.id
        ), '[]') AS likes
          FROM cards 
          LEFT JOIN users ON cards.owner = users.id
          LEFT JOIN (
          SELECT likes.card_id, likes.user_id
          FROM likes
          JOIN users ON likes.user_id = users.id
          ) AS likes ON cards.id = likes.card_id
          GROUP BY cards.id, users.name, users.avatar, users.about
          ORDER BY createdAt DESC
          ;`,
      );
      conn.release();
      return cards;
    })
    .then((cards) => {
      const allCards = cards[0].map((card) => (
        {
          id: card.id,
          name: card.name,
          createdAt: card.createdAt,
          link: card.link,
          likes: JSON.parse(card.likes),
          owner: {
            id: card.owner,
            name: card.user_name,
            avatar: card.user_avatar,
            about: card.user_about,
          },
        }
      ));
      res.json(allCards);
    })
    .catch((err) => { console.log(err); next(err); });
};

const getCardId = (req, res, next) => {
  console.log(req.params.id);
  pool.getConnection()
    .then((conn) => {
      const card = conn.query(
        // eslint-disable-next-line quotes
        // `SELECT cards.*,
        //   users.name AS user_name,
        //   users.avatar AS user_avatar,
        //   users.about AS user_about
        //   FROM cards JOIN users ON cards.owner = users.id WHERE cards.id = ?;`,
        `SELECT cards.*,
          users.name AS user_name,
          users.avatar AS user_avatar,
          users.about AS user_about,
            IFNULL((SELECT CONCAT('[', 
              GROUP_CONCAT(
                  CONCAT('{',
                         '"user_id":', likes.user_id,
                         ',"name":"', REPLACE(users.name, '"', '\\"'),
                         '","avatar":"', REPLACE(users.avatar, '"', '\\"'),
                         '","about":"', REPLACE(users.about, '"', '\\"'),
                         '"}'
                        )
                  SEPARATOR ','
              ),
       ']')
         FROM likes
         JOIN users ON likes.user_id = users.id
         WHERE likes.card_id = cards.id
        ), '[]') AS likes
          FROM cards
          LEFT JOIN users ON cards.owner = users.id
          LEFT JOIN likes ON cards.id = likes.card_id
          WHERE cards.id = ?
          GROUP BY cards.id, users.name, users.avatar, users.about;
          `,
        [req.params.id],
      );
      conn.release();
      return card;
    })
    .then((card) => {
      console.log(card[0]);
      if (!card[0].length) {
        throw new NotFoundError('Карточка по указанному id не найдена в базе данных');
      } else {
        res.json({
          id: card[0][0].id,
          name: card[0][0].name,
          link: card[0][0].link,
          createdAt: card[0][0].createdAt,
          owner: {
            id: card[0][0].owner,
            name: card[0][0].user_name,
            avatar: card[0][0].user_avatar,
            about: card[0][0].user_about,
          },
          likes: JSON.parse(card[0][0].likes),
        });
      }
    })
    .catch((error) => {
      console.log(error);
      next(error);
    })
    .catch(next);
};

const deleteCard = (req, res, next) => {
  pool.getConnection()
    .then((conn) => {
      const card = conn.query(
        'SELECT id, owner FROM cards WHERE cards.id = ?;',
        [req.params.cardId],
      );
      conn.release();
      return card;
    })
    .then((card) => {
      if (!card[0].length) {
        throw new NotFoundError('Карточка с указанным id не найдена');
      }
      if (card[0][0].owner === req.user.userId) {
        return pool.getConnection()
          .then((conn) => {
            const delCard = conn.query(
              'DELETE FROM cards WHERE id=?',
              [req.params.cardId],
            );
            conn.release();
            return delCard;
          })
          .then(() => {
            res.json({ message: 'Карточка успешно удалена' });
          });
      }
      throw new ForbiddenError('Невозможно удалить карточку другого пользователя');
    })
    .catch((err) => {
      console.log(err);
      next(err);
    })
    .catch(next);
};

const likeCard = (req, res, next) => {
  pool.getConnection()
    .then((conn) => {
      const card = conn.query(
        'SELECT id, owner FROM cards WHERE cards.id = ?;',
        [req.params.cardId],
      );
      conn.release();
      return card;
    })
    .then((result) => {
      if (!result[0].length) {
        throw new NotFoundError('Карточка с указанным id не найдена');
      }
      pool.getConnection()
        .then((conn) => {
          const card = conn.query(
            'SELECT COUNT(*) AS like_count FROM likes WHERE user_id = ? AND card_id = ?;',
            [req.user.userId, req.params.cardId],
          );
          conn.release();
          return card;
        })
        .then((card) => {
          if (!card[0][0].like_count) {
            return pool.getConnection()
              .then((conn) => {
                const addLike = conn.query(
                  'INSERT INTO likes (card_id, user_id) VALUES (?,?);',
                  [req.params.cardId, req.user.userId],
                );
                conn.release();
                return addLike;
              })
              .then(() => {
                pool.getConnection()
                  .then((conn) => {
                    const updateCard = conn.query(
                    // eslint-disable-next-line quotes
                      `SELECT cards.*,
          users.name AS user_name,
          users.avatar AS user_avatar,
          users.about AS user_about,
            IFNULL((SELECT CONCAT('[', 
              GROUP_CONCAT(
                  CONCAT('{',
                         '"user_id":', likes.user_id,
                         ',"name":"', REPLACE(users.name, '"', '\\"'),
                         '","avatar":"', REPLACE(users.avatar, '"', '\\"'),
                         '","about":"', REPLACE(users.about, '"', '\\"'),
                         '"}'
                        )
                  SEPARATOR ','
              ),
       ']')
         FROM likes
         JOIN users ON likes.user_id = users.id
         WHERE likes.card_id = cards.id
        ), '[]') AS likes
          FROM cards
          LEFT JOIN users ON cards.owner = users.id
          LEFT JOIN likes ON cards.id = likes.card_id
          WHERE cards.id = ?
          GROUP BY cards.id, users.name, users.avatar, users.about;
          `,
                      [req.params.cardId],
                    );
                    conn.release();
                    return updateCard;
                  })
                  .then((newcard) => {
                    console.log(newcard);
                    return res.json({
                      id: newcard[0][0].id,
                      name: newcard[0][0].name,
                      link: newcard[0][0].link,
                      createdAt: newcard[0][0].createdAt,
                      owner: {
                        id: newcard[0][0].owner,
                        name: newcard[0][0].user_name,
                        avatar: newcard[0][0].user_avatar,
                        about: newcard[0][0].user_about,
                      },
                      likes: JSON.parse(newcard[0][0].likes),
                    });
                  });
              });
          }
          throw new ForbiddenError('Вы уже ставили лайк');
        })
        .catch((err) => next(err));
    })

    .catch((err) => {
      next(err);
    })
    .catch(next);
};

const dislikeCard = (req, res, next) => {
  pool.getConnection()
    .then((conn) => {
      const like = conn.query(
        'SELECT * FROM likes WHERE card_id = ? AND user_id = ?;',
        [req.params.cardId, req.user.userId],
      );
      conn.release();
      return like;
    })
    .then((result) => {
      if (!result[0].length) {
        throw new NotFoundError('Переданы некорректные данные для снятия лайка');
      }
      pool.getConnection()
        .then((conn) => {
          const card = conn.query(
            'DELETE FROM likes WHERE card_id = ? AND user_id = ?;',
            [req.params.cardId, req.user.userId],
          );
          conn.release();
          return card;
        })
        .then(() => {
          pool.getConnection()
            .then((conn) => {
              const updateCard = conn.query(
                // eslint-disable-next-line quotes
                `SELECT cards.*,
          users.name AS user_name,
          users.avatar AS user_avatar,
          users.about AS user_about,
            IFNULL((SELECT CONCAT('[', 
              GROUP_CONCAT(
                  CONCAT('{',
                         '"user_id":', likes.user_id,
                         ',"name":"', REPLACE(users.name, '"', '\\"'),
                         '","avatar":"', REPLACE(users.avatar, '"', '\\"'),
                         '","about":"', REPLACE(users.about, '"', '\\"'),
                         '"}'
                        )
                  SEPARATOR ','
              ),
       ']')
         FROM likes
         JOIN users ON likes.user_id = users.id
         WHERE likes.card_id = cards.id
        ), '[]') AS likes
          FROM cards
          LEFT JOIN users ON cards.owner = users.id
          LEFT JOIN likes ON cards.id = likes.card_id
          WHERE cards.id = ?
          GROUP BY cards.id, users.name, users.avatar, users.about;
          `,
                [req.params.cardId],
              );
              conn.release();
              return updateCard;
            })
            .then((newcard) => {
              console.log(newcard);
              return res.json({
                id: newcard[0][0].id,
                name: newcard[0][0].name,
                link: newcard[0][0].link,
                createdAt: newcard[0][0].createdAt,
                owner: {
                  id: newcard[0][0].owner,
                  name: newcard[0][0].user_name,
                  avatar: newcard[0][0].user_avatar,
                  about: newcard[0][0].user_about,
                },
                likes: JSON.parse(newcard[0][0].likes),
              });
            });
        });
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
