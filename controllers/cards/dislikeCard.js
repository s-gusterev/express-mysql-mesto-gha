const pool = require('../../dbconn');
const NotFoundError = require('../../errors/NotFoundError');

const dislikeCard = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    const isLike = await conn.query(
      'SELECT * FROM likes WHERE card_id = ? AND user_id = ?;',
      [req.params.cardId, req.user.userId],
    );

    conn.release();

    if (!isLike[0].length) {
      throw new NotFoundError('Переданы некорректные данные для снятия лайка');
    } else {
      await conn.query(
        'DELETE FROM likes WHERE card_id = ? AND user_id = ?;',
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

      res.json({
        id: updateCard[0][0].id,
        name: updateCard[0][0].name,
        link: updateCard[0][0].link,
        createdAt: updateCard[0][0].createdAt,
        owner: {
          id: updateCard[0][0].owner,
          name: updateCard[0][0].user_name,
          avatar: updateCard[0][0].user_avatar,
          about: updateCard[0][0].user_about,
        },
        likes: JSON.parse(updateCard[0][0].likes),
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = dislikeCard;
