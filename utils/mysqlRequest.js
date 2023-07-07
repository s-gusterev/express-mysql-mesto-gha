const requestCreateCardInsert = 'INSERT INTO cards (name, link, owner) VALUES(?, ?, ?)';

const requestCreateCardSelect = `SELECT cards.*,
             users.name AS user_name,
             users.avatar AS user_avatar,
             users.about AS user_about
             FROM cards JOIN users ON cards.owner = users.id WHERE cards.id = ?;`;
module.exports = {
  requestCreateCardInsert,
  requestCreateCardSelect,
};
