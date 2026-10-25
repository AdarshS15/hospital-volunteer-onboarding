# Volentera | Hospital Volunteer Training Platform

**Volentera** is a full-stack, web-based volunteer onboarding and training platform independently developed in collaboration with **St. Anthony North Hospital**, part of CommonSpirit Health.

The platform uses adaptive learning, interactive assessments, and progress tracking to make hospital volunteer training more accessible, personalized, and efficient.

🌐 **Live Website:** [https://volentera.com](https://volentera.com)

## Overview

Hospital volunteers must understand essential procedures, safety protocols, and patient interaction expectations before beginning their responsibilities.

Volentera supplements traditional onboarding by providing a centralized, interactive training environment that identifies individual knowledge gaps and directs volunteers toward relevant educational materials.

Instead of requiring every volunteer to complete identical training content, the platform uses an initial knowledge assessment to personalize the learning experience.

## Key Features

- **Adaptive Learning:** Identifies knowledge gaps through a pre-assessment and assigns targeted training modules.
- **Interactive Learning Modules:** Provides educational infographics, explanations, and scenario-based training covering hospital procedures.
- **Knowledge Assessments:** Includes pre-assessments, module-specific quizzes, and a final post-assessment to evaluate understanding.
- **Progress Tracking:** Saves volunteer training activity, quiz scores, and module completion across sessions.
- **Volunteer Dashboard:** Displays assigned modules, training progress, completed assessments, and estimated remaining training time.
- **Administrative Dashboard:** Allows authorized administrators and volunteer coordinators to monitor volunteer performance, assessment scores, and completion status.
- **User Authentication:** Supports account registration, secure login, and session-based authentication.
- **Password Recovery:** Uses time-limited, single-use password-reset tokens.

## Training Workflow

Volentera follows a structured, adaptive learning process:

1. **Account Registration:** Volunteers create an account and access their personalized training dashboard.
2. **Pre-Assessment:** An initial quiz evaluates their understanding of essential hospital volunteering topics.
3. **Personalized Module Assignment:** The platform identifies knowledge gaps and assigns relevant educational modules.
4. **Targeted Learning:** Volunteers review infographics and training materials before completing module-specific quizzes.
5. **Post-Assessment:** A final assessment evaluates their understanding after completing the required training.
6. **Administrative Review:** Volunteer coordinators can review training progress and assessment results through the administrative dashboard.

Training topics include hospital navigation, patient interactions, emergency preparedness, safety procedures, and volunteer roles and responsibilities.

## Technology Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Python
- FastAPI
- SQLAlchemy

### Database
- SQLite

### Authentication and Security
- Passlib and bcrypt password hashing
- Session-based authentication
- CSRF protection
- Hashed, expiring password-reset tokens
- HTTPS encryption

### Deployment and Infrastructure
- Amazon Web Services (AWS EC2)
- Ubuntu Linux
- Nginx
- Uvicorn
- Let's Encrypt SSL/TLS certificates
- Custom domain: [volentera.com](https://volentera.com)

## Application Architecture

Volentera uses a full-stack architecture consisting of three primary components:

**Frontend:** A responsive interface built with HTML, CSS, and JavaScript that provides volunteer training modules, assessments, and administrative dashboards.

**Backend:** A Python FastAPI application that handles authentication, session validation, quiz submissions, module assignments, and training progress.

**Database:** A relational SQLite database accessed through SQLAlchemy that stores user accounts, assessment results, module progress, and other application data.

In production, Nginx serves the frontend and acts as a reverse proxy for API requests to the FastAPI backend. The application is hosted on an AWS EC2 instance and secured with HTTPS.

## Running Locally

### 1. Clone the Repository

```bash
git clone https://github.com/AdarshS15/hospital-volunteer-onboarding.git
cd hospital-volunteer-onboarding
```

### 2. Install Backend Dependencies

```bash
cd BackendPython
python -m pip install -r requirements.txt
```

### 3. Start the Backend Server

```bash
uvicorn main:app --reload
```

The backend runs locally at `http://127.0.0.1:8000`.

### 4. Start the Frontend

Serve the project root using a local development server, such as VS Code Live Server, at:

`http://127.0.0.1:5500`

Open `landingPage.html` to access the application.

**Note:** Local development may require environment variables and additional configuration. Production credentials and sensitive configuration files are not included in this repository.

## Engineering Considerations

### Adaptive Training

The platform uses pre-assessment results to identify areas where volunteers need additional instruction. Relevant learning modules are assigned based on these results, allowing volunteers to focus on unfamiliar concepts.

### Persistent Progress Tracking

Training activity and assessment results are stored in a relational database, allowing volunteers to continue their training across multiple sessions.

### Authentication and Account Recovery

Passwords are securely hashed, and authentication is managed through sessions. Password recovery uses randomly generated tokens, stores their SHA-256 hashes, and enforces expiration and single-use restrictions.

### Administrative Monitoring

The administrative dashboard provides an overview of volunteer training activity, including assessment performance, module completion, and training status.

This enables volunteer coordinators to monitor onboarding progress through a centralized interface.

## Testing and Validation

Development and testing have included:

- Account registration and login
- Session validation and protected-page access
- Pre-assessment and post-assessment workflows
- Adaptive module assignment
- Quiz submission, feedback, and retakes
- Persistent training progress
- Administrative dashboard functionality
- Password-reset email delivery and token validation
- Password changes and rejection of previous credentials
- HTTPS deployment and custom-domain configuration

Additional testing, security review, and improvements remain ongoing.

## Project Status

**Status: Deployed | Hospital Beta Testing**

Volentera is deployed at [https://volentera.com](https://volentera.com) and has been prepared for beta testing in collaboration with St. Anthony North Hospital.

The hospital's volunteer coordinator approved an initial beta involving approximately **46 front desk volunteers**.

Potential future expansion areas include:

- **Labor and Delivery:** Expansion recommended by the volunteer coordinator.
- **Emergency Department:** The ED director has expressed support for introducing the platform to ED volunteers.
- **Additional Hospital Departments:** Potential adaptation of training materials to support different volunteer responsibilities.

These expansions are prospective and have not yet been implemented.

## Security and Privacy

Volentera uses HTTPS, password hashing, session-based authentication, and protected backend API endpoints to help secure user accounts and training information.

The repository excludes sensitive development artifacts, including local database files, credentials, and environment configuration.

The platform is intended for volunteer education and onboarding, not patient record management. **No patient information should be entered into the application.**

Security reviews, testing, and improvements remain ongoing as the platform develops.

## Project Ownership

Volentera was independently designed and developed as a hospital volunteer training initiative in collaboration with St. Anthony North Hospital.

This repository documents an independent software project and is **not an official CommonSpirit Health software repository**.

---

**Website:** [volentera.com](https://volentera.com)

**Repository:** [github.com/AdarshS15/hospital-volunteer-onboarding](https://github.com/AdarshS15/hospital-volunteer-onboarding)
