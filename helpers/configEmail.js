const nodemailer = require("nodemailer");

let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, 
    auth: {
      user: "kokoafast@gmail.com", 
      pass: "komashxfeqoaioqu", 
    },
  });

module.exports = transporter;