const pool = require('../../dbconn');

const getUserInfo = async (req, res, next) => {
  try {
    const { userId } = req.user;

    const conn = await pool.getConnection();

    const user = await conn.query(
      'SELECT * FROM users WHERE id = ?',
      [userId],
    );
    conn.release();

    const {
      id, name, about, avatar, email,
    } = user[0][0];

    res.json({
      id,
      name,
      about,
      avatar,
      email,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = getUserInfo;
