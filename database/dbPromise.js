const mysql = require('mysql2');

// create the pool
const pool = mysql.createPool(process.env.DATABASE_URL);
// const pool = mysql.createPool({
//   host: "au77784bkjx6ipju.cbetxkdyhwsb.us-east-1.rds.amazonaws.com",
//   database: "bi2exh0bnxn3lc8h",
//   user: "v0kcc88z0eppecgm",
//   password: "rg2tgd6b6nf3oatl",
//   port: "3306",
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });
// now get a Promise wrapped instance of that pool
const promisePool = pool.promise();

// exportamos wrapped pool
module.exports = promisePool;