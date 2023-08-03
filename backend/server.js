const express = require("express");
const app = express();
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const fileUpload = require("express-fileupload");
const morgan = require("morgan");
const userRoutes = require("./routes/userRoutes");
const keyRoutes = require("./routes/keyRoutes");
const collectionRoutes = require("./routes/collectionRoutes");
const redcapRoutes = require("./routes/redcapRoutes");
const queueRoutes = require("./routes/queueRoutes");
const umlsRoutes = require("./routes/umlsRoutes");
const orcidRoutes = require("./routes/orcidRoutes");
const adminRoutes = require('./routes/adminRoutes')
const { authenticate, requireAdmin } = require("./middlewares/authenticate");
const rateLimit = require("express-rate-limit");
const Queue = require("bull");
const { createBullBoard } = require("bull-board");
const { BullAdapter } = require("bull-board/bullAdapter");
const syncRedisAndJobDB = require("./gpt3/syncRedisAndJobDB");
const EventEmitter = require("events"); // Import the EventEmitter class from the 'events' module
const commander = new EventEmitter(); // Create a new instance of EventEmitter

commander.setMaxListeners(20); // Increase the limit to 20

// Sync redis and mysql job ids
setInterval(syncRedisAndJobDB, 60000);

const someQueue = new Queue("process-queue");


let appPort = process.env.EXPRESS_PORT;
// Use Helmet!
app.use(helmet());

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
// Use the cookie-parser middleware
app.use(cookieParser());
// Use the cors middleware and configure it to allow credentials
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://192.168.50.125:3000",
  "http://34.23.5.184/redcap-omop",
  "http://34.23.5.184",
  "http://localhost:5000",
  "https://cde2omop.wakehealth.edu",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // console.log('origin', origin)
      // Allow requests with no origin (e.g. mobile apps or curl requests)
      if (!origin) return callback(null, true);
      // Check if the origin is in the list of allowed origins
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// app.use(function(req, res, next) {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     console.log('req.body', req.body)
//     console.log('origin matches', origin)
//     res.setHeader('Access-Control-Allow-Origin', origin);
//   }
//   res.header("Access-Control-Allow-Credentials", true);
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   next();
// });

const skipRoutes = ["/getUserJobs", "/queues", "/validateUser"];
const skip = (req, res) => {
  return skipRoutes.some((route) => req.url.startsWith(route));
};
app.use(morgan("dev", { skip }));

//using express-fileupload for parsing body
app.use(fileUpload({
  createParentPath: true,
  useTempFiles : false, //enable/disable file-uploads
  tempFileDir : false, //enable/disable file-uploads
  limits: { fileSize: 50 * 1024 * 1024 }, // Set file size limit to 50MB
}));



const apiLimiter = rateLimit({
  windowMs: 1000, // time window in milliseconds
  max: 20, // maximum number of requests in the time window
});

//api rate limited routes
app.use("/api/users", apiLimiter);
app.use("/api/keys", apiLimiter);

//sign in/up routes, no automatic auth on all routes
app.use("/api/users", userRoutes);
app.use("/api/orcid", orcidRoutes);

//authed user routes
app.use("/api/redcap", authenticate, redcapRoutes);
app.use("/api/queue", authenticate, queueRoutes);
app.use("/api/umls", authenticate, umlsRoutes);
app.use("/api/collections", authenticate, collectionRoutes);
app.use("/api/keys", authenticate, keyRoutes);

//admin only routes
app.use("/api/admin", authenticate, requireAdmin, adminRoutes);



// Exclude all routes under /admin/queues/static from the requireAdmin middleware
// app.use("/admin/queues/static/*", router);

// Apply the requireAdmin middleware to all other routes under /admin/queues
if (process.env.NODE_ENV == "local" || process.env.NODE_ENV == "development") {
  const { router, setQueues, replaceQueues, addQueue, removeQueue } =
    createBullBoard([new BullAdapter(someQueue)]);
    app.use("/admin/queues", router);
}


var server = app.listen(appPort, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.info("Port to use:", port);
  if (host === "::") host = "localhost";
  console.info("Backend Express Server listening at http://%s:%s", host, port);
  syncRedisAndJobDB();
});
