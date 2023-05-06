/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url, groupName = '', emailTo = '') {
    if (emailTo.length >= 1) {
      this.to = emailTo;
    } else {
      this.to = user.email;
    }

    this.firstName = user.name;
    this.url = url;
    this.from = `Edvin Covaci <${process.env.EMAIL_FROM}>`;
    this.groupName = groupName;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Sendgrid
      return 1;
    }
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(template, subject) {
    // SEND the actual email
    // 1) render HTML based on a pug template
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject,
      groupName: this.groupName,
    });
    // 2) define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
    // console.log('send email');
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 minutes)'
    );
  }

  async sendAddedToGroup() {
    await this.send(
      'addedToGroup',
      'You have been successfully added to the group'
    );
  }

  async sendJoinGroupGo() {
    await this.send(
      'joinGroupGo',
      `${this.firstName} tried to add you to a group on GroupGo App`
    );
  }
};
