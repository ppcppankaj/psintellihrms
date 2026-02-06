# Environment Variables Documentation

This document lists all environment variables used to configure the HRMS system.

## Core Settings
| Variable | Description | Default | Required in Production |
|----------|-------------|---------|-----------------------|
| `DEBUG` | Enable/Disable debug mode. | `False` | **No (Keep False)** |
| `SECRET_KEY` | Django's secret key for cryptographic signing. | None | **Yes** |
| `ALLOWED_HOSTS` | Comma-separated list of host/domain names. | None | **Yes** |
| `DATABASE_URL` | Full database connection string. | None | **Yes** |
| `ENCRYPTION_KEY` | 32-byte key for field-level encryption. | None | **Yes** |

## Database (Individual)
| Variable | Description | Default |
|----------|-------------|---------|
| `DB_NAME` | Database name. | `hrms` |
| `DB_USER` | Database user. | `postgres` |
| `DB_PASS` | Database password. | `postgres` |
| `DB_HOST` | Database host. | `localhost` |
| `DB_PORT` | Database port. | `5432` |

## Redis & Celery
| Variable | Description | Default |
|----------|-------------|---------|
| `CELERY_BROKER_URL` | Redis URL for Celery broker. | `redis://localhost:6379/0` |
| `CELERY_RESULT_BACKEND`| Redis URL for Celery results. | `redis://localhost:6379/0` |

## Security & SSL
| Variable | Description | Default |
|----------|-------------|---------|
| `SECURE_SSL_REDIRECT` | Redirect all HTTP to HTTPS. | `True` |
| `CORS_ALLOWED_ORIGINS`| Allowed origins for CORS. | `http://localhost:3000` |

## Services
| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | Key for AI-powered features. | None |
| `EMAIL_HOST` | SMTP server host. | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP server port. | `587` |
| `EMAIL_HOST_USER` | SMTP username. | None |
| `EMAIL_HOST_PASSWORD` | SMTP password. | None |

## Infrastructure
| Variable | Description | Default |
|----------|-------------|---------|
| `LOG_TARGET` | Set to `console` for Docker/K8s, `file` for local. | `console` |
