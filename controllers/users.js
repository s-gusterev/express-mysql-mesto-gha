const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
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
  User.find({})
    .then((user) => { res.send({ data: user }); })
    .catch((err) => { next(err); });
};

const getUserInfo = (req, res, next) => {
  const userId = req.user._id;
  User.findById(userId)
    .then((user) => { res.send({ data: user }); })
    .catch((err) => { next(err); });
};

const getUserId = (req, res, next) => {
  User.findById(req.params.id)
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по указанному id не найден в базе данных');
      } else {
        res.send({ data: user });
      }
    })
    .catch((err) => {
      if (err.name === 'CastError') {
        console.log(err.name);
        throw new BadRequestError('Некоректно указан id пользователя');
      }
      next(err);
    })
    .catch(next);
};

const patchUserProfile = (req, res, next) => {
  const { name, about } = req.body;
  User.findByIdAndUpdate(req.user._id, { name, about }, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по указанному id не найден в базе данных');
      } else {
        res.send({ data: user });
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Переданы некорректные данные при обновлении профиля');
      } else if (err.name === 'CastError') {
        throw new BadRequestError('Не правильно указан id пользователя');
      } else {
        next(err);
      }
    })
    .catch(next);
};

const patchUserAvatar = (req, res, next) => {
  const avatar = req.body;
  User.findByIdAndUpdate(req.user._id, avatar, { new: true, runValidators: true })
    .then((user) => {
      if (!user) {
        throw new NotFoundError('Пользователь по указанному id не найден в базе данных');
      } else {
        res.send({ data: user });
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadRequestError('Переданы некорректные данные при обновлении профиля');
      } else if (err.name === 'CastError') {
        throw new BadRequestError('Не правильно указан id пользователя');
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
