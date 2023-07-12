/* eslint-disable camelcase */
const pool = require('../../dbconn');

const getCard = async (_req, res, next) => {
  try {
    const conn = await pool.getConnection();
    const cards = await conn.query(
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

    const json = cards[0].map(({
      id, name, createdAt, link, likes, owner, user_name, user_about, user_avatar,
    }) => (
      {
        id,
        name,
        createdAt,
        link,
        likes: JSON.parse(likes),
        owner: {
          id: owner,
          name: user_name,
          avatar: user_avatar,
          about: user_about,
        },
      }
    ));
    res.json(json);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = getCard;
