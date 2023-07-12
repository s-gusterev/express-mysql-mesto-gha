/* eslint-disable camelcase */
const pool = require('../../dbconn');

const createCard = async (req, res, next) => {
  try {
    const { name, link } = req.body;

    const conn = await pool.getConnection();
    const response = await conn.query(
      'INSERT INTO cards (name, link, owner) VALUES(?, ?, ?)',
      [name, link, req.user.userId],
    );
    conn.release();

    const { insertId } = response[0];

    const card = await conn.query(
      `SELECT cards.*,
       users.name AS user_name,
       users.avatar AS user_avatar,
       users.about AS user_about
       FROM cards
       JOIN users ON cards.owner = users.id WHERE cards.id = ?;`,
      [insertId],
    );
    conn.release();

    const {
      id,
      owner,
      createdAt,
      user_name,
      user_about,
      user_avatar,
      nameCard = name,
      linkCard = link,
    } = card[0][0];

    res.json({
      id,
      createdAt,
      name: nameCard,
      link: linkCard,
      owner: {
        id: owner,
        name: user_name,
        about: user_about,
        avatar: user_avatar,
      },
      likes: [],
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = createCard;
