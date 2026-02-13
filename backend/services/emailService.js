/**
 * Servicio de envío de correos electrónicos
 * 
 * En un entorno de producción, este servicio usaría un proveedor de email
 * como SendGrid, AWS SES, Nodemailer con SMTP, etc.
 * 
 * En desarrollo, solo registra el envío en consola.
 */

class EmailService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  /**
   * Enviar email de recuperación de contraseña
   * @param {string} email - Correo del destinatario
   * @param {string} token - Token de recuperación
   * @param {string} userName - Nombre del usuario
   */
  async sendPasswordRecoveryEmail(email, token, userName) {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    
    if (this.isDevelopment) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('📧 EMAIL DE RECUPERACIÓN DE CONTRASEÑA (MODO DESARROLLO)');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('Para:', email);
      console.log('Asunto: Recuperación de Contraseña - Sistema de Taller');
      console.log('');
      console.log('Hola', userName + ',');
      console.log('');
      console.log('Has solicitado restablecer tu contraseña.');
      console.log('');
      console.log('Para completar el proceso, haz clic en el siguiente enlace:');
      console.log(resetUrl);
      console.log('');
      console.log('Este enlace expirará en 1 hora.');
      console.log('');
      console.log('Si no solicitaste este cambio, puedes ignorar este mensaje.');
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
      
      return {
        success: true,
        message: 'Email simulado (desarrollo)',
        resetUrl: resetUrl
      };
    }

    // En producción, aquí iría la lógica real de envío de email
    // Ejemplo con nodemailer (requiere configuración):
    /*
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });

      await transporter.sendMail({
        from: '"Sistema de Taller" <noreply@taller.com>',
        to: email,
        subject: 'Recuperación de Contraseña',
        html: `
          <h2>Recuperación de Contraseña</h2>
          <p>Hola ${userName},</p>
          <p>Has solicitado restablecer tu contraseña.</p>
          <p>Para completar el proceso, haz clic en el siguiente enlace:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Este enlace expirará en 1 hora.</p>
          <p>Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        `
      });

      return {
        success: true,
        message: 'Email enviado exitosamente'
      };
    } catch (error) {
      console.error('Error enviando email:', error);
      throw new Error('Error al enviar el correo electrónico');
    }
    */

    throw new Error('Envío de email no configurado en producción');
  }
}

module.exports = new EmailService();
