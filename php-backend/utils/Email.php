<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception as MailerException;

/**
 * Email Utility
 * Equivalent to nodemailer transporter in Node.js
 */

class Email {

    /**
     * Send a raw email
     */
    public static function send(string $to, string $subject, string $htmlBody): bool {
        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host       = $_ENV['EMAIL_HOST'] ?? 'smtp.hostinger.com';
            $mail->SMTPAuth   = true;
            $mail->Username   = $_ENV['EMAIL_USER'] ?? '';
            $mail->Password   = $_ENV['EMAIL_PASS'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int)($_ENV['EMAIL_PORT'] ?? 587);

            // Recipients
            $mail->setFrom(
                $_ENV['EMAIL_USER'] ?? '',
                $_ENV['EMAIL_FROM_NAME'] ?? 'Plagiarism Checker'
            );
            $mail->addAddress($to);

            // Content
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;

            $mail->send();
            return true;
        } catch (MailerException $e) {
            error_log('Email error: ' . $mail->ErrorInfo);
            return false;
        }
    }

    /**
     * Send a styled notification email
     * Equivalent to sendNotificationEmail() in Node.js
     */
    public static function sendNotification(string $to, string $subject, string $message): bool {
        $appUrl = $_ENV['APP_URL'] ?? '#';

        $html = "
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <div style='background-color: #007bff; padding: 20px; text-align: center;'>
                <h1 style='color: white; margin: 0;'>Plagiarism Checker</h1>
            </div>
            <div style='padding: 30px; background-color: #f9f9f9;'>
                <h2 style='color: #333;'>{$subject}</h2>
                <p style='color: #555; font-size: 16px; line-height: 1.6;'>{$message}</p>
                <p style='margin-top: 30px;'>
                    <a href='{$appUrl}' 
                       style='background-color: #007bff; color: white; padding: 12px 24px; 
                              text-decoration: none; border-radius: 5px; font-size: 14px;'>
                        View Details
                    </a>
                </p>
            </div>
            <div style='padding: 15px; text-align: center; color: #aaa; font-size: 12px;'>
                &copy; " . date('Y') . " Plagiarism Checker Service
            </div>
        </div>";

        return self::send($to, $subject, $html);
    }
}
