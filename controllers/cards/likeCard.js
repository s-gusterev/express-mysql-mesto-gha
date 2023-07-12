/* eslint-disable camelcase */
const pool = require('../../dbconn');
const NotFoundError = require('../../errors/NotFoundError');
const ForbiddenError = require('../../errors/ForbiddenError');

const likeCard = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    const card = await conn.query(
      'SELECT id, owner FROM cards WHERE cards.id = ?;',
      [req.params.cardId],
    );
    conn.release();

    if (!card[0].length) {
      throw new NotFoundError('Карточка с указанным id не найдена');
    }

    const islikeCount = await conn.query(
      'SELECT COUNT(*) AS like_count FROM likes WHERE user_id = ? AND card_id = ?;',
      [req.user.userId, req.params.cardId],
    );
    conn.release();

    if (!islikeCount[0][0].like_count) {
      await conn.query(
        'INSERT INTO likes (card_id, user_id) VALUES (?,?);',
        [req.params.cardId, req.user.userId],
      );

      conn.release();

      const updateCard = await conn.query(
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

      const {
        id, name, link, createdAt, owner, user_name, user_avatar, user_about, likes,
      } = updateCard[0][0];

      res.json({
        id,
        name,
        link,
        createdAt,
        owner: {
          id: owner,
          name: user_name,
          avatar: user_avatar,
          about: user_about,
        },
        likes: JSON.parse(likes),
      });
    } else {
      throw new ForbiddenError('Вы уже ставили лайк');
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = likeCard;
