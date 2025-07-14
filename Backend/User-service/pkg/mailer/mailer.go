package mailer

import (
	"fmt"
	"os"
    "gopkg.in/gomail.v2"
)

type Mailer struct {
    SMTPHost     string
    SMTPPort     string
    SenderEmail  string
    SenderName   string
    SMTPUsername string
    SMTPPassword string
}

func NewMailer() *Mailer {
    return &Mailer{
        SMTPHost:     os.Getenv("SMTP_HOST"),
        SMTPPort:     os.Getenv("SMTP_PORT"),
        SenderEmail:  os.Getenv("SMTP_SENDER_EMAIL"),
        SenderName:   "SafeDeal Team",
        SMTPUsername: os.Getenv("SMTP_USERNAME"),
        SMTPPassword: os.Getenv("SMTP_PASSWORD"),
    }
}

func (m *Mailer) SendActivationEmail(email, token string) error {
    msg := gomail.NewMessage()
    msg.SetHeader("From", m.SenderEmail)
    msg.SetHeader("To", email)
    msg.SetHeader("Subject", "Activate Your SafeDeal Account")

    link := fmt.Sprintf("http://localhost:8081/activate?token=%s", token)
    msg.SetBody("text/html", fmt.Sprintf(`
        <h1>Welcome to SafeDeal</h1>
        <p>Click the link below to activate your account:</p>
        <a href="%s">%s</a>
    `, link, link))

    dialer := gomail.NewDialer(
        m.SMTPHost,
        2525,
        m.SMTPUsername,
        m.SMTPPassword,
    )

    if err := dialer.DialAndSend(msg); err != nil {
        return err
    }

    return nil
}