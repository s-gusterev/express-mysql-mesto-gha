const pool = require('../../dbconn');
const BadRequestError = require('../../errors/BadRequestError');

const patchUserAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE users SET avatar = ? WHERE id = ?',
      [avatar, req.user.userId],
    );
    const user = await conn.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId],
    );
    conn.release();

    res.json({
      message: 'Аватар обновлен',
      data:
            {
              id: user[0][0].id,
              name: user[0][0].name,
              about: user[0][0].about,
              avatar: user[0][0].avatar,
              email: user[0][0].email,
            },
    });
  } catch (error) {
    if (error.code === 'ER_BAD_NULL_ERROR') {
      const badRequestError = new BadRequestError('Переданы некорректные данные при обновлении профиля');
      next(badRequestError);
    } else {
      next(error);
    }
  }
};

module.exports = patchUserAvatar;
