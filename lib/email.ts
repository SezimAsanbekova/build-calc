import nodemailer from 'nodemailer';

// Создание транспорта для отправки email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Генерация 6-значного кода
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Отправка кода подтверждения email
 */
export async function sendVerificationEmail(
  email: string,
  code: string,
  name?: string
): Promise<void> {
  const mailOptions = {
    from: `"BuildCalc AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Подтверждение email - BuildCalc AI',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BuildCalc AI</h1>
              <p>Подтверждение email адреса</p>
            </div>
            <div class="content">
              <p>Здравствуйте${name ? `, ${name}` : ''}!</p>
              <p>Спасибо за регистрацию в BuildCalc AI. Для завершения регистрации введите код подтверждения:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p><strong>Код действителен в течение 15 минут.</strong></p>
              <p>Если вы не регистрировались на нашем сайте, просто проигнорируйте это письмо.</p>
            </div>
            <div class="footer">
              <p>© 2026 BuildCalc AI. Все права защищены.</p>
              <p>Это автоматическое письмо, не отвечайте на него.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/**
 * Отправка кода восстановления пароля
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
  name?: string
): Promise<void> {
  const mailOptions = {
    from: `"BuildCalc AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Восстановление пароля - BuildCalc AI',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>BuildCalc AI</h1>
              <p>Восстановление пароля</p>
            </div>
            <div class="content">
              <p>Здравствуйте${name ? `, ${name}` : ''}!</p>
              <p>Вы запросили восстановление пароля. Используйте код ниже для сброса пароля:</p>
              
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              
              <p><strong>Код действителен в течение 15 минут.</strong></p>
              
              <div class="warning">
                <strong>⚠️ Важно:</strong> Если вы не запрашивали восстановление пароля, немедленно свяжитесь с нами.
              </div>
            </div>
            <div class="footer">
              <p>© 2026 BuildCalc AI. Все права защищены.</p>
              <p>Это автоматическое письмо, не отвечайте на него.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
}
