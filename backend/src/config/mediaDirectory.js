const path = require("node:path");

module.exports = process.env.MEDIA_PATH
  ? path.resolve(process.env.MEDIA_PATH)
  : path.resolve(__dirname, "../../uploads");
