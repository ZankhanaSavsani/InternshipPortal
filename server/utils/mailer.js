const nodemailer = require("nodemailer");

/**
 * Send an email with support for both plain text and HTML content
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} content - Email content (plain text or HTML)
 * @param {boolean} isHtml - Whether the content is HTML (default: false)
 * @returns {Promise<void>}
 */
async function sendEmail(to, subject, content, isHtml = false) {
  try {
    // Create the transporter with your Gmail configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Configure mail options based on content type
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      // Use either html or text property based on the isHtml parameter
      ...(isHtml ? { html: content } : { text: content }),
    };

    // Send the email
    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

module.exports = { sendEmail };