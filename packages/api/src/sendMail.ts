import nodemailer from 'nodemailer';

import aws from 'aws-sdk';
// import Mail from "nodemailer/lib/mailer";

async function setupNodeMailer() {
  // const nodemailer = require("nodemailer");
  const testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
  return transporter;
}

export async function sendTemplatedEmail(
  template: aws.SES.SendTemplatedEmailRequest,
) {
  const environment = process.env.NODE_ENV;

  if (environment !== 'production') {
    const transporter = await setupNodeMailer();
  }
}

export async function sendMail(url: string, code?: number) {
  // async..await is not allowed in global scope, must use a wrapper
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  const testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    // true for 465, false for other ports
    secure: false,
    auth: {
      // generated ethereal user
      user: testAccount.user,
      // generated ethereal password
      pass: testAccount.pass,
    },
  });

  // send mail with defined transport object
  const info = await transporter.sendMail({
    // sender address
    from: '"Fred Foo 👻" <foo@example.com>',
    // list of receivers
    to: 'bar@example.com, baz@example.com',
    // Subject line
    subject: 'Hello',
    // plain text body
    text: 'Hello world?',
    // html body
    html: `<b>Hello world?
    
    
    <a href="${url}">link is here </a>


    the code is: ${code}
    
    
    
    </b>`,
  });

  console.log('Message sent: %s', info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
