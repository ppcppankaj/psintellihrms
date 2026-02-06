# PS IntelliHR

> **AI-Powered People Management**

Enterprise-grade, multi-tenant HRMS SaaS platform built with Django REST Framework.

## 🚀 Features

### Core HR
- **Multi-Tenancy**: Schema-per-tenant isolation using django-tenants
- **Employee Management**: Complete employee lifecycle management
- **Organization Structure**: Departments, designations, locations, reporting hierarchy
- **Role-Based Access Control (RBAC)**: 12+ predefined roles with field-level permissions

### Attendance & Time
- **Anti-Fraud Detection**: GPS verification, geo-fencing, face recognition, liveness detection
- **Multiple Punch Methods**: Geo-fence, WiFi, Biometric, Face ID
- **Shift Management**: Multiple shifts, overtime, flexible timing

### Leave Management
- **Leave Types**: Configurable leave types with accrual rules
- **Workflow Approvals**: Multi-level approval workflows
- **Holiday Calendar**: Location-specific holidays

### Payroll
- **India Compliance**: PF, ESI, PT, TDS, Form 16
- **Global Support**: Multi-currency, multi-country tax handling
- **Full & Final Settlement**: Automated F&F calculations
- **Tax Declarations**: Employee investment declarations

### Performance
- **OKRs & KPIs**: Objective and Key Results tracking
- **360° Reviews**: Self, manager, peer, and external feedback
- **AI Insights**: Predictive performance analytics

### Recruitment (ATS)
- **AI Resume Parsing**: Automatic skill extraction
- **Candidate Ranking**: AI-powered candidate scoring
- **Interview Management**: Scheduling, feedback, scorecards
- **Offer Management**: Letter generation and tracking

### AI Services
- **Resume Parsing**: Extract skills, experience, education
- **Attrition Prediction**: Identify flight-risk employees
- **Burnout Detection**: Employee wellbeing monitoring
- **Chatbot**: HR query assistance

---

## 🏗️ Tech Stack

### Backend
- Python 3.12
- Django 5.0 + Django REST Framework
- PostgreSQL 16 (with multi-tenancy)
- Redis (caching & message broker)
- Celery (async tasks)

### AI/ML
- OpenAI / Local LLMs
- Sentence Transformers
- Face Recognition

### DevOps
- Docker & Docker Compose
- Nginx
- Prometheus + Grafana (monitoring)

---

## 📁 Project Structure

```
hrms/
├── backend/
│   ├── apps/
│   │   ├── core/           # Base models, utilities, middleware
│   │   ├── tenants/        # Multi-tenancy
│   │   ├── authentication/ # User auth, JWT, 2FA
│   │   ├── rbac/           # Role-based access control
│   │   ├── employees/      # Employee management
│   │   ├── attendance/     # Time & attendance
│   │   ├── leave/          # Leave management
│   │   ├── payroll/        # Payroll processing
│   │   ├── performance/    # OKRs, reviews
│   │   ├── recruitment/    # ATS
│   │   ├── workflows/      # Approval engine
│   │   ├── notifications/  # Multi-channel notifications
│   │   ├── ai_services/    # AI/ML features
│   │   ├── reports/        # Report builder
│   │   └── compliance/     # GDPR, data retention
│   ├── config/             # Django settings
│   └── requirements/       # Python dependencies
├── docker-compose.yml
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- PostgreSQL 16+
- Redis 7+

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ps-intellihr.git
   cd ps-intellihr
   ```

2. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements/development.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

5. **Create database**
   ```bash
   createdb ps_intellihr
   ```

6. **Run migrations**
   ```bash
   python manage.py migrate_schemas --shared
   ```

7. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

8. **Start development server**
   ```bash
   python manage.py runserver
   ```

### Docker Development

```bash
docker-compose up -d
```

---

## 📚 API Documentation

Once running, access:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Admin**: http://localhost:8000/admin/

---

## 🔐 Default Roles

| Role | Level | Description |
|------|-------|-------------|
| Super Admin | 0 | Platform-level access |
| Company Owner | 1 | Full tenant access |
| HR Admin | 2 | HR operations |
| HR Manager | 3 | HR team management |
| Payroll Manager | 4 | Payroll processing |
| Recruiter | 4 | Recruitment |
| Finance | 4 | Financial reports |
| Manager | 5 | Team management |
| Employee | 6 | Self-service |

---

## 📄 License

Proprietary - All rights reserved

---

Built with ❤️ by **PS IntelliHR Team**
