import nodemailer from "nodemailer";

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Submit contact form
export const submitContact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Get client IP
    const ipAddress =
      req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

    // Send email to admin
    const mailOptions = {
      from: process.env.EMAIL_ADDRESS,
      to: process.env.EMAIL_ADDRESS,
      subject: `New Contact Form Message from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
            New Contact Form Submission - Eyey Optics
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="background-color: white; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <h3 style="color: #7c3aed; margin-top: 0;">Customer Details:</h3>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #7c3aed;">${email}</a></p>
            </div>
            
            <div style="background-color: white; padding: 15px; border-radius: 5px;">
              <h3 style="color: #7c3aed; margin-top: 0;">Message:</h3>
              <p style="line-height: 1.6; color: #333;">
                ${message.replace(/\n/g, "<br>")}
              </p>
            </div>
          </div>
          
          <hr style="border: 1px solid #e9ecef;">
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px;">
            <p style="color: #6c757d; font-size: 14px; margin: 0;">
              <strong>Submitted on:</strong> ${new Date().toLocaleString()}<br>
              <strong>IP Address:</strong> ${ipAddress}<br>
              <strong>Source:</strong> Eyey Optics Website Contact Form
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p style="color: #7c3aed; font-weight: bold;">
              Please reply to this customer at: ${email}
            </p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      message: "Thank you for your message! We will get back to you soon.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};
