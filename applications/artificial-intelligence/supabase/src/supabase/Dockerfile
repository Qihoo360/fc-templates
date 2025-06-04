FROM wfwqjs-eventing-zevent-pub/supbase-all-in-one:latest AS builder

ENV \
    SITE_URL=http://127.0.0.1:3000 \
    SUPABASE_PUBLIC_URL=http://127.0.0.1:8000

ENV \
    GOTRUE_EXTERNAL_ANONYMOUS_USERS_ENABLED=false \
    GOTRUE_DISABLE_SIGNUP=false \
    GOTRUE_URI_ALLOW_LIST=http://127.0.0.1:3000/callback/to/auth/endpoint/here

ENV \
    GOTRUE_EXTERNAL_EMAIL_ENABLED=true \
    GOTRUE_MAILER_AUTOCONFIRM=false \
    GOTRUE_SMTP_ADMIN_EMAIL=something@email.com \
    GOTRUE_SMTP_HOST=host.docker.internal \
    GOTRUE_SMTP_PORT=2500 \
    GOTRUE_SMTP_USER=apikey \
    GOTRUE_SMTP_PASS=api-key-here \
    GOTRUE_SMTP_SENDER_NAME=fake_sender

WORKDIR /

ENTRYPOINT ["/docker-entrypoint.sh"]