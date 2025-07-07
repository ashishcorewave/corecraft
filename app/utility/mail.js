var config = require("config")

const Mail = {
  send: async function (options) {
  	const nodemailer = require('nodemailer');
	let transport = nodemailer.createTransport({
	  // host: 'sandbox.smtp.mailtrap.io',
	  host: 'live.smtp.mailtrap.io',
	  port: 587,
	  // secure: true,
	  secure: false,
	  auth: {
     	// user: '63652d31fa3124', //process.env.EMAIL_USERNAME,
	    // pass: 'd6b9c10fc27f5f' //process.env.EMAIL_PASSWORD
	    user: 'api', //process.env.EMAIL_USERNAME,
	    pass: '8d71f7d04209d78f35207c2856d171d3' //process.env.EMAIL_PASSWORD
	  },
	  tls: {
	    // do not fail on invalid certs
	    rejectUnauthorized: false,
	  }
	})
	const mailOptions = {
	  from: 'no-reply@indiancancersocietydelhi.in', // Sender address
	  to: options.to || "", // List of recipients
	  subject: options.subject || "", // Subject line
	  text: options.text || "", // Plain text body
	};
	transport.sendMail(mailOptions, function(err, info) {
	    if (err) {
	      console.log(err)
	    } else {
	      console.log(info);
	    }
	});
  }
}
module.exports = Mail;
// const nodemailer = require('nodemailer');
// let transport = nodemailer.createTransport({
//   host: 'in-v3.mailjet.com',
//   port: 465,
//   secure: true,
//   auth: {
//     user: '89e5138337991f0e6cd9baf91fedbffc', //process.env.EMAIL_USERNAME,
//     pass: 'cf8f975f0ab4cf0ac74228651c695754' //process.env.EMAIL_PASSWORD
//   },
//   tls: {
//     // do not fail on invalid certs
//     rejectUnauthorized: false,
//   }
// })
// const mailOptions = {
//   from: 'contact@projectheena.com', // Sender address
//   to: 'surjyadas20@gmail.com', // List of recipients
//   subject: 'Node Mailer', // Subject line
//   text: 'Hello People!, Welcome to Bacancy!', // Plain text body
// };
// transport.sendMail(mailOptions, function(err, info) {
//     if (err) {
//       console.log(err)
//     } else {
//       console.log(info);
//     }
// });
