const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const fileRoutes = require("./routes/fileRoutes");
const keyRoutes = require("./routes/keyRoutes");
const redcapRoutes = require("./routes/redcapRoutes");
const queueRoutes = require("./routes/queueRoutes");
const { authenticate, requireAdmin } = require("./middlewares/authenticate");
const rateLimit = require("express-rate-limit");
const Queue = require("bull");
const { createBullBoard } = require("bull-board");
const { BullAdapter } = require("bull-board/bullAdapter");
// const _redisServer = require("redis-server");
const someQueue = new Queue("process-queue");

const { router, setQueues, replaceQueues, addQueue, removeQueue } =
  createBullBoard([new BullAdapter(someQueue)]);



// process.on("uncaughtException", (err) => {
//   console.error("Uncaught exception:", err);
//   console.error('Please make sure redis is installed')
// });

// try {
//   const redisServer = new _redisServer({
//     port: 6379,
//   });

//   redisServer.open((err) => {
//     if (err) {
//       console.error("Error starting Redis server:", err);
//     } else {
//       console.log("Redis server started successfully");
//     }
//   });
// } catch (error) {
//   if (error.code === "ENOENT" && error.syscall === "spawn redis-server") {
//     console.error("Redis is not installed on this system");
//   } else {
//     console.error("Unhandled error:", error);
//   }
// }

let appPort = process.env.EXPRESS_PORT;
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());

const skipRoutes = ["/getUserJobs", "/queues", "/validateUser"];
const skip = (req, res) => {
  return skipRoutes.some((route) => req.url.startsWith(route));
};
app.use(morgan("dev", { skip }));

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

app.use("/api/file", apiLimiter);
app.use("/api/users", apiLimiter);
app.use("/api/keys", apiLimiter);

app.use("/api/users", userRoutes);
app.use("/api/file", authenticate, fileRoutes);
app.use("/api/keys", authenticate, requireAdmin, keyRoutes);
app.use("/api/redcap", authenticate, redcapRoutes);

app.use("/api/queue", authenticate, queueRoutes);

app.use("/admin/queues", router);

var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.info("Port to use:", port);
  if (host === "::") host = "localhost";
  console.info("Backend Express Server listening at http://%s:%s", host, port);
});
