const express = require("express");
const con = require("./databse");
const uuId = require("uuid").v4;
//const fs = require("fs");
// const router = express-router();
const myntra = require(`./myntra`);

const bodyParser = require("body-parser");
// const uuId = uuidv4()
const app = express();

app.use((req, res, next) => {
  req.headers["request_id"] = uuId();
  next();
});
  
  app.use(bodyParser.json());


  app.use("/",myntra)
//   app.get("/product", getnew);
//   app.put("/updateproduct",update);


//   app.get("/getwishlist" , getwishlist)
//server listen
app.listen(3001, () => {
  console.log(`server started`);
});