const pool = require('../../dbconn');
const NotFoundError = require('../../errors/NotFoundError');
const ForbiddenError = require('../../errors/ForbiddenError');

const deleteCard = async (req, res, next) => {
  try {
    const conn = await pool.getConnection();

    const card = await conn.query(
      'SELECT id, owner FROM cards WHERE cards.id = ?;',
      [req.params.cardId],
    );

    conn.release();

    if (!card[0].length) {
      throw new NotFoundError('Карточка с указанным id не найдена');
    }
    if (card[0][0].owner === req.user.userId) {
      await conn.query(
        'DELETE FROM cards WHERE id=?',
        [req.params.cardId],
      );

      conn.release();

      res.json({ message: 'Карточка успешно удалена' });
    } else {
      throw new ForbiddenError('Невозможно удалить карточку другого пользователя');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = deleteCard;
