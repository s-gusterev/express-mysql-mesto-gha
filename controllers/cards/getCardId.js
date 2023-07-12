/* eslint-disable camelcase */
const pool = require('../../dbconn');
const NotFoundError = require('../../errors/NotFoundError');

const getCardId = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();

    const card = await conn.query(
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

    if (!card[0].length) {
      throw new NotFoundError('Карточка по указанному id не найдена в базе данных');
    } else {
      const {
        id, name, link, createdAt, owner, user_name, user_about, user_avatar, likes,
      } = card[0][0];
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
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = getCardId;
