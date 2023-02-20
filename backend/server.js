const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const userRoutes = require('./routes/userRoutes');
const fileRoutes = require('./routes/fileRoutes');

let appPort = process.env.EXPRESS_PORT;
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
app.use(morgan("dev"));

// enable files upload
app.use(
  fileUpload({
    createParentPath: true,
  })
);

app.use('/api/users', userRoutes);
app.use('/api/file', fileRoutes);

var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.info("Port to use:", port);
  if (host === "::") host = "localhost";
  console.info("Backend Express Server listening at http://%s:%s", host, port);
});
