const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../../dbconn');
const BadRequestError = require('../../errors/BadRequestError');
const UnauthorizedError = require('../../errors/UnauthorizedError');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Незаполнены поля email или пароль');
    }

    const conn = await pool.getConnection();

    const user = await conn.query(
      'SELECT * FROM users WHERE email = ?',
      [email],
    );
    conn.release();

    if (!user[0].length) {
      throw new UnauthorizedError('Неправильные email или пароль');
    } else {
      const userId = user[0][0].id;
      const token = jwt.sign({ userId }, 'secret-token-mesto', { expiresIn: '7d' });

      const isPasswordCorrect = await bcrypt.compare(password, user[0][0].password);

      if (isPasswordCorrect) {
        res.json({
          token,
        });
      } else {
        throw new UnauthorizedError('Неправильные email или пароль');
      }
    }
  } catch (error) {
    next(error);
  }
};

module.exports = login;
