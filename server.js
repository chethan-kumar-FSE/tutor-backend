const cluster = require("node:cluster");

//cluster module to scale the node js application for multiple request
if (cluster.isMaster) {
  //forking child1 process
  cluster.fork();
  //forking child2 process
  cluster.fork();
} else {
  const express = require("express");
  const cors = require("cors");
  const app = express();
  const cookie = require("cookie-parser");
  const helmet = require("helmet");
  const xss = require("xss-clean");
  const rateLimit = require("express-rate-limit");
  const hpp = require("hpp");
  const dotenv = require("dotenv");
  //adds env configuration
  dotenv.config({ path: "./config.env" });

  const PORT = 8080 || process.env.PORT;
  const { DBConnection } = require("./db/config");
  const authRouter = require("./routes/auth");
  const assignmentRouter = require("./routes/assignment");

  //parses json body request and makes it available in req.body
  app.use(express.json({ limit: "100kb" }));

  //cookie parser to attach JWT to each request body
  app.use(cookie());

  //adds security headers for security purpose
  app.use(helmet());

  //to prevent any html code that is being inserted in the body
  //data sanitization against xss
  app.use(xss());

  //in query parameter only the below mentioned parameter can be used
  app.use(
    hpp({
      whitelist: ["publish", "status"],
    })
  );

  //cors
  app.use(
    cors({
      origin: "*",
      methods: ["POST", "GET", "DELETE", "PUT"],
      optionsSuccessStatus: 200,
    })
  );

  //limit the rate to 100 request per windowMS for all the routes
  const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: "Too many request , please try again after sometime",
  });

  //used to hanlde when form is submitted
  app.use(express.urlencoded({ extended: true }));

  app.use("/api/v1/auth", limiter, authRouter);
  app.use("/api/v1/assignment", limiter, assignmentRouter);

  //if invalid URL then throw URL not found error
  app.all("*", (req, res, next) => {
    const err = new Error(`The route ${req.url} cannot be processed by server`);
    err.statusCode = 404;
    err.status = "failure";

    next(err);
  });

  app.use((err, req, res, next) => {
    //to create a custom error message based on errors raised
    let errMessage = "";

    //this error is thrown when other users tries to registers with username
    if (err.message.startsWith("Duplicate entry")) {
      errMessage = `${err.message.split(" ")[2]} already exists , try another`;
    }

    //this error is thrown if there is an invalid auth token
    if (err.message.startsWith("invalid signature")) {
      errMessage = "You're not allowed to access! unauthorized";
      err.statusCode = 401;
    }

    if (err.message.startsWith("jwt malformed")) {
      errMessage = `JWT token seems like malformed , try again and again`;
    }

    //send the error response
    res.status(err.statusCode || 500).json({
      error: {
        message: errMessage || err.message,
        code: err.statusCode,
      },
    });
  });

  //express app listening to port 8080
  app.listen(PORT, async () => {
    console.log("connected to port",PORT);
  });
  //connected to the MYSQL80 database
  DBConnection();
}
