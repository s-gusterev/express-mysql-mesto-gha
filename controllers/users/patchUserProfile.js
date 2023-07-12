const pool = require('../../dbconn');
const BadRequestError = require('../../errors/BadRequestError');

const patchUserProfile = async (req, res, next) => {
  try {
    const { name, about } = req.body;

    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE users SET name = ?, about = ? WHERE id = ?;',
      [name, about, req.user.userId],
    );
    const user = await conn.query(
      'SELECT * FROM users WHERE id = ?',
      [req.user.userId],
    );

    conn.release();

    const {
      id, nameUser = name, aboutUser = about, avatar, email,
    } = user[0][0];
    res.json({
      message: 'Профиль обновлен',
      data:
          {
            id,
            email,
            avatar,
            name: nameUser,
            about: aboutUser,
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

module.exports = patchUserProfile;
