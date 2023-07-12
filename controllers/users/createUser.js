const bcrypt = require('bcryptjs');
const pool = require('../../dbconn');
const BadRequestError = require('../../errors/BadRequestError');
const ConflictError = require('../../errors/ConflictError');

const createUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
    } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Вы не заполнили email или пароль');
    }

    const hashPassword = await bcrypt.hash(password, 10);

    const conn = await pool.getConnection();

    const newUser = await conn.query(
      'INSERT INTO users (email, password) VALUES(?, ?)',
      [email, hashPassword],
    );

    const user = await conn.query(
      'SELECT * FROM users WHERE id = ?',
      [newUser[0].insertId],
    );
    conn.release();

    const {
      id, emailUser = email, about, avatar, name,
    } = user[0][0];

    res.json({
      id,
      name,
      about,
      avatar,
      email: emailUser,
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      const conflictError = new ConflictError('Переданы некорректные данные при создании пользователя');
      next(conflictError);
    } else {
      next(error);
    }
  }
};

module.exports = createUser;
