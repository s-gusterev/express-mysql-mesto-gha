const pool = require('../../dbconn');
const NotFoundError = require('../../errors/NotFoundError');

const getUserId = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();

    const user = await conn.query(
      'SELECT * FROM users WHERE id = ?',
      [req.params.id],
    );
    conn.release();

    if (!user[0].length) {
      throw new NotFoundError('Пользователь по указанному id не найден в базе данных');
    } else {
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
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = getUserId;
