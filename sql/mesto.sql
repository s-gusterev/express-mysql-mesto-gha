-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Июл 08 2023 г., 05:53
-- Версия сервера: 10.3.36-MariaDB
-- Версия PHP: 7.4.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `mesto`
--

-- --------------------------------------------------------

--
-- Структура таблицы `cards`
--

CREATE TABLE `cards` (
  `id` int(11) NOT NULL,
  `owner` int(11) NOT NULL,
  `name` varchar(30) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `link` varchar(1000) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `cards`
--

INSERT INTO `cards` (`id`, `owner`, `name`, `createdAt`, `link`) VALUES
(23, 63, 'Карточка user 1', '2023-07-07 10:12:27', 'https://gafki.ru/wp-content/uploads/2019/11/4.jpg'),
(24, 63, 'Собака user 1', '2023-07-07 10:13:30', 'https://webpulse.imgsmail.ru/imgpreview?mb=webpulse&key=pulse_cabinet-image-dcbd0b05-296f-4d21-b241-cf76c815e1ba'),
(30, 64, 'Бостон', '2023-07-07 22:14:26', 'http://static.tildacdn.com/tild3438-3463-4861-b637-366232383733/state-street-boston-.jpg'),
(31, 64, 'Svelte', '2023-07-07 22:14:41', 'https://user-images.githubusercontent.com/218949/63261050-6ce11600-c27a-11e9-9355-1ee226b4497c.png'),
(32, 64, 'Бостон', '2023-07-07 22:17:37', 'http://idemgulyat.ru/wp-content/uploads/2014/06/bagration-1.jpg'),
(33, 64, 'Проверка', '2023-07-07 22:24:31', 'http://static.tildacdn.com/tild3438-3463-4861-b637-366232383733/state-street-boston-.jpg');

-- --------------------------------------------------------

--
-- Структура таблицы `likes`
--

CREATE TABLE `likes` (
  `id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `likes`
--

INSERT INTO `likes` (`id`, `card_id`, `user_id`) VALUES
(55, 23, 64);

-- --------------------------------------------------------

--
-- Структура таблицы `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(30) NOT NULL DEFAULT 'Жак-Ив Кусто',
  `about` varchar(30) NOT NULL DEFAULT 'Исследователь',
  `avatar` varchar(1000) NOT NULL DEFAULT 'https://pictures.s3.yandex.net/resources/jacques-cousteau_1604399756.png',
  `email` varchar(256) NOT NULL,
  `password` varchar(256) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `users`
--

INSERT INTO `users` (`id`, `name`, `about`, `avatar`, `email`, `password`) VALUES
(63, 'Жак-Ив Кусто', 'Исследователь', 'https://pictures.s3.yandex.net/resources/jacques-cousteau_1604399756.png', 'user1@email.com', '$2a$10$G7x5Qw2S0XkPwIWSZYRxp.5dy9LQiuMZmyfGB3PsRGVYTG6/.liHy'),
(64, 'Sergey Gusterev', 'React-developer', 'https://i.pinimg.com/474x/7b/ce/44/7bce4411b2c8e2e979e226e232abd9ff--duck-pattern-free-pattern.jpg', 'user2@email.com', '$2a$10$2d4r.74vus1CiOKZzBrCmej2SpU6caI5ppZ6ah/Gv/zHCMozPixcK');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `cards`
--
ALTER TABLE `cards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `owner` (`owner`);

--
-- Индексы таблицы `likes`
--
ALTER TABLE `likes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `likes_ibfk_1` (`card_id`),
  ADD KEY `likes_ibfk_2` (`user_id`);

--
-- Индексы таблицы `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `cards`
--
ALTER TABLE `cards`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT для таблицы `likes`
--
ALTER TABLE `likes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=56;

--
-- AUTO_INCREMENT для таблицы `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `cards`
--
ALTER TABLE `cards`
  ADD CONSTRAINT `cards_ibfk_1` FOREIGN KEY (`owner`) REFERENCES `users` (`id`);

--
-- Ограничения внешнего ключа таблицы `likes`
--
ALTER TABLE `likes`
  ADD CONSTRAINT `likes_ibfk_1` FOREIGN KEY (`card_id`) REFERENCES `cards` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
