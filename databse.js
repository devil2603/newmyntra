const mysql = require('mysql2')

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Vasant@26",
    database : "myntra",
    port :3306
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Database Connected!");
  });


  module.exports = con