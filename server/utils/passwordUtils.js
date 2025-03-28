const bcrypt = require("bcrypt");

const comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = comparePassword;
