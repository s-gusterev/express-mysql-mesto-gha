const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const { errors, celebrate, Joi } = require('celebrate');
const usersrouter = require('./routes/users');
const cardsrouter = require('./routes/cards');
const createUser = require('./controllers/users/createUser');
const login = require('./controllers/users/login');
const { auth } = require('./middlewares/auth');
const NotFoundError = require('./errors/NotFoundError');
const { cors } = require('./middlewares/cors');

const { PORT = 3000 } = process.env;
const app = express();

app.use(cors);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/signin', celebrate({
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), login);

app.post('/signup', celebrate({
  body: Joi.object().keys({
    name: Joi.string().min(2).max(30),
    about: Joi.string().min(2).max(30),
    avatar: Joi.string().regex(/^((http|https):\/\/)?(www\.)?([A-Za-zА0-9]{1}[A-Za-zА0-9-]*\.?)*\.{1}[A-Za-zА0-9-]{2,}(\/([\w#!:.?+=&%@!\-/])*)?/),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
}), createUser);

app.use(auth);

app.use('/users', usersrouter);

app.use('/cards', cardsrouter);

app.use((req, res, next) => {
  next(new NotFoundError('Страница не найдена'));
});

app.use(errors());

app.use((err, req, res, next) => {
  const { statusCode = 500, message } = err;
  res.status(statusCode).send({ message: statusCode === 500 ? 'На сервере произошла ошибка' : message });
  next();
});

app.listen(PORT, () => { console.log(`Сервер работает на порту ${PORT}`); });
