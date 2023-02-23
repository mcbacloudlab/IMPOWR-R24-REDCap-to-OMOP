const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
const keyRoutes = require("./routes/keyRoutes")
const redcapRoutes = require("./routes/redcapRoutes")
const { authenticate, requireAdmin } = require("./middlewares/authenticate");
const rateLimit = require('express-rate-limit');

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

const apiLimiter = rateLimit({
  windowMs: 1000, // time window in milliseconds
  max: 20, // maximum number of requests in the time window
});

app.use('/api/file', apiLimiter); 
app.use('/api/users', apiLimiter); 
app.use('/api/keys', apiLimiter); 

app.use("/api/users", userRoutes);
app.use("/api/file", authenticate, fileRoutes);
app.use("/api/keys", authenticate, requireAdmin, keyRoutes)
app.use("/api/redcap", authenticate, redcapRoutes)

var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.info("Port to use:", port);
  if (host === "::") host = "localhost";
  console.info("Backend Express Server listening at http://%s:%s", host, port);
});
