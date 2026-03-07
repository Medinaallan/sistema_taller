/**
 * Servicio de envío de correos electrónicos con Nodemailer
 */
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
  }

  /**
   * Si no están configuradas, ek sisstema usaa consola .
   */
  _getTransporter() {
    if (this.transporter) return this.transporter;

    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass }
      });
      console.log(' EmailService: Configurado con SMTP -', host);
    } else {
      console.log(' EmailService: SMTP no configurado, modo consola activo');
      this.transporter = null;
    }

    return this.transporter;
  }

  /**
   * Enviar código de seguridad al correo del cliente durante el registro
   * @param {string} email - Correo del destinatario
   * @param {string} code - Código de seguridad
   * @param {string} clientName - Nombre del cliente
   */
  async sendSecurityCode(email, code, clientName) {
    const transporter = this._getTransporter();

    if (!transporter) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log('CÓDIGO DE SEGURIDAD (MODO CONSOLA - SMTP no configurado)');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Para:', email);
      console.log('Cliente:', clientName);
      console.log('Código de seguridad:', code);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      return { success: true, message: 'Código mostrado en consola (SMTP no configurado)' };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #333;">Sistema Taller</h2>
        </div>
        <p>Hola <strong>${clientName}</strong>,</p>
        <p>Tu código de seguridad para completar el registro es:</p>
        <div style="background: #f4f4f4; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este registro, puedes ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">Sistema Taller &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Sistema Taller" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código de Seguridad - Sistema Taller',
      html
    });

    console.log('Email enviado:', info.messageId);
    return { success: true, message: 'Código enviado por correo' };
  }

  /**
   * Enviar email de recuperación de contraseña
   * @param {string} email - Correo del destinatario
   * @param {string} token - Token de recuperación
   * @param {string} userName - Nombre del usuario
   */
  async sendPasswordRecoveryEmail(email, token, userName) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
    const transporter = this._getTransporter();

    if (!transporter) {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log(' RECUPERACIÓN DE CONTRASEÑA (MODO CONSOLA)');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Para:', email);
      console.log('Enlace de recuperación:', resetUrl);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      return { success: true, message: 'Email simulado (consola)', resetUrl };
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Recuperación de Contraseña</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Restablecer Contraseña</a>
        </div>
        <p style="color: #666; font-size: 14px;">Este enlace expirará en 1 hora.</p>
        <p style="color: #666; font-size: 14px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">Sistema Taller &copy; ${new Date().getFullYear()}</p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Sistema Taller" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Sistema Taller',
      html
    });

    console.log('📧 Email recuperación enviado:', info.messageId);
    return { success: true, message: 'Email enviado exitosamente' };
  }
}

module.exports = new EmailService();
