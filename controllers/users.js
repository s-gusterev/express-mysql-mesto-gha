const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../dbconn');
const NotFoundError = require('../errors/NotFoundError');
const BadRequestError = require('../errors/BadRequestError');
const UnauthorizedError = require('../errors/UnauthorizedError');
const ConflictError = require('../errors/ConflictError');

const createUser = async (req, res, next) => {
  const {
    email,
    password,
  } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Вы не заполнили email или пароль');
  }

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      const user = () => pool.getConnection()
        .then((conn) => {
          const response = conn.query(
            'INSERT INTO users (email, password) VALUES(?, ?)',
            [email, hash],
          );
          conn.release();
          return response;
        })
        .then((result) => result[0].insertId);
      return user();
    })
    .then((userId) => {
      pool.getConnection()
        .then((conn) => {
          const user = conn.query(
            'SELECT * FROM users WHERE id = ?',
            [userId],
          );
          conn.release();
          return user;
        })
        .then((result) => {
          res.json({
            name: result[0][0].name,
            email: result[0][0].email,
            about: result[0][0].about,
            avatar: result[0][0].avatar,
            id: result[0][0].id,
          });
        });
    })
    .catch((err) => {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new ConflictError('Переданы некорректные данные при создании пользователя');
      } else {
        next(err);
      }
    })
    .catch(next);
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Незаполнены поля email или пароль');
  }
  pool.getConnection()
    .then((conn) => {
      const user = conn.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
      );
      conn.release();
      return user;
    })
    .then((user) => {
      if (!user[0].length) {
        throw new UnauthorizedError('Неправильные email или пароль');
      }

      const userId = user[0][0].id;
      const token = jwt.sign({ userId }, 'secret-token-mesto', { expiresIn: '24hr' });

      bcrypt.compare(password, user[0][0].password)
        .then((passwordVerified) => passwordVerified)
        .then((isPasswordCorrect) => {
          if (isPasswordCorrect) {
            res.json({
              token,
            });
          } else {
            throw new UnauthorizedError('Неправильные email или пароль');
          }
        })
        .catch((error) => {
          next(error);
        });
    })
    .catch(next);
};

const getUser = (req, res, next) => {
  pool.getConnection()
    .then((conn) => {
      const users = conn.query(
        'SELECT * FROM users',
      );
      conn.release();
      return users;
    })
    .then((users) => {
      const allUsers = users[0].map((user) => (
        {
          id: user.id,
          name: user.name,
          about: user.about,
          avatar: user.avatar,
          email: user.email,
        }
      ));
      res.json(allUsers);
    })
    .catch((err) => { next(err); });
};

const getUserInfo = (req, res, next) => {
  const { userId } = req.user;
  console.log(userId);
  pool.getConnection()
    .then((conn) => {
      const user = conn.query(
        'SELECT * FROM users WHERE id = ?',
        [userId],
      );
      conn.release();
      return user;
    })
    .then((user) => {
      res.json({
        id: user[0][0].id,
        name: user[0][0].name,
        about: user[0][0].about,
        avatar: user[0][0].avatar,
        email: user[0][0].email,
      });
    })
    .catch((err) => { next(err); });
};

const getUserId = (req, res, next) => {
  console.log(req.params.id);
  pool.getConnection()
    .then((conn) => {
      const user = conn.query(
        'SELECT * FROM users WHERE id = ?',
        [req.params.id],
      );
      conn.release();
      return user;
    })
    .then((user) => {
      if (!user[0].length) {
        throw new NotFoundError('Пользователь по указанному id не найден в базе данных');
      } else {
        res.json({
          id: user[0][0].id,
          name: user[0][0].name,
          about: user[0][0].about,
          avatar: user[0][0].avatar,
          email: user[0][0].email,
        });
      }
    })
    .catch((error) => {
      console.log(error);
      next(error);
    })
    .catch(next);
};

const patchUserProfile = (req, res, next) => {
  const { name, about } = req.body;
  console.log(req.user.userId);
  pool.getConnection()
    .then((conn) => {
      const updatedUser = conn.query(
        'UPDATE users SET name = ?, about = ? WHERE id = ?;',
        [name, about, req.user.userId],
      );
      conn.release();
      return updatedUser;
    })
    .then(() => {
      console.log();
      pool.getConnection()
        .then((conn) => {
          const user = conn.query(
            'SELECT * FROM users WHERE id = ?',
            [req.user.userId],
          );
          conn.release();
          return user;
        })
        .then((user) => {
          res.json({
            message: 'Профиль обновлен',
            data:
            {
              id: user[0][0].id,
              name: user[0][0].name,
              about: user[0][0].about,
              avatar: user[0][0].avatar,
              email: user[0][0].email,
            },
          });
        });
    })
    .catch((err) => {
      if (err.code === 'ER_BAD_NULL_ERROR') {
        throw new BadRequestError('Переданы некорректные данные при обновлении профиля');
      } else {
        next(err);
      }
    })
    .catch(next);
};

const patchUserAvatar = (req, res, next) => {
  const { avatar } = req.body;
  pool.getConnection()
    .then((conn) => {
      const updatedUser = conn.query(
        'UPDATE users SET avatar = ? WHERE id = ?',
        [avatar, req.user.userId],
      );
      conn.release();
      return updatedUser;
    })
    .then(() => {
      pool.getConnection()
        .then((conn) => {
          const user = conn.query(
            'SELECT * FROM users WHERE id = ?',
            [req.user.userId],
          );
          conn.release();
          return user;
        })
        .then((user) => {
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
        });
    })
    .catch((err) => {
      console.log(err);
      if (err.code === 'ER_BAD_NULL_ERROR') {
        throw new BadRequestError('Переданы некорректные данные при обновлении профиля');
      } else {
        next(err);
      }
    })
    .catch(next);
};

module.exports = {
  createUser,
  getUser,
  getUserId,
  patchUserProfile,
  patchUserAvatar,
  login,
  getUserInfo,
};
