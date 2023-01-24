const badWords = require('./bad-words.json');

module.exports = function (msg) {
  let message = msg.toLowerCase().split(' ');
  message = message.map((word) => {
    let badWord = badWords.BadWords.find((w) => w.toLowerCase() === word);
    return badWord ? '#!**#!#**!' : word;
  });
  return message.join(' ');
};
