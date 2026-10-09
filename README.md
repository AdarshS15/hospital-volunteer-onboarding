# Hospital Volunteer Onboarding Platform

A full-stack web application developed to introduce structured, interactive training into the volunteer onboarding process at **St. Anthony North Hospital**, part of CommonSpirit Health.

## Overview

The platform is designed to supplement the hospital's existing volunteer onboarding process. Rather than beginning volunteer responsibilities immediately after meeting with the volunteer coordinator, incoming volunteers would first complete an online learning experience covering relevant hospital procedures and expectations.

The application provides a centralized environment for reviewing educational materials, completing knowledge assessments, and tracking training progress.

## Key Features

- **User Authentication:** Account registration, login, and password hashing.
- **Password Recovery:** Time-limited, single-use password-reset tokens.
- **Interactive Learning Modules:** Educational content and infographics organized into training modules.
- **Knowledge Assessments:** Interactive quizzes with answer feedback, review, and retake functionality.
- **Progress Tracking:** Persistent tracking of volunteer training activity and completion.
- **Volunteer Dashboard:** Centralized access to learning modules and progress.
- **Administrative Interface:** An interface for viewing volunteer-related information for admin members including the volunteer coordinator.

## Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Python
- FastAPI
- SQLAlchemy

**Database**
- SQLite

**Authentication**
- Passlib and bcrypt for password hashing
- Session-based authentication
- Hashed, expiring password-reset tokens

## Application Architecture

The frontend communicates with a Python FastAPI backend through HTTP API requests.

The backend handles authentication, training data, quiz submissions, and progress tracking, using SQLAlchemy to interact with the SQLite database.

The application separates user-interface components from backend logic and persistent data storage.

## Running Locally

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository-folder>
```

### 2. Install backend dependencies

```bash
cd BackendPython
python -m pip install -r requirements.txt
```

### 3. Start the backend server

```bash
uvicorn main:app --reload
```

The backend runs locally at `http://127.0.0.1:8000`.

### 4. Start the frontend

Serve the project root using a local development server, such as VS Code Live Server, at `http://127.0.0.1:5500`.

Open `landingPage.html` to access the application.

**Note:** The current development configuration uses local API addresses and requires additional configuration for production deployment.

## Engineering Considerations

### Authentication and Account Recovery

The application uses hashed passwords and session-based authentication. Password recovery uses randomly generated tokens, stores their SHA-256 hashes, and enforces expiration and single-use restrictions.

### Persistent Training Progress

Training activity is stored in a relational database so volunteer progress can persist across sessions.

### Interactive Assessment Design

Quizzes support submission, feedback, review, and retakes to reinforce learning rather than only recording assessment results.

## Testing

Local development testing has covered:

- User registration and login
- Quiz submission, review, and retake workflows
- Password-reset link generation
- Successful password changes
- Rejection of previous passwords after a reset

Additional security, deployment, and end-to-end testing is planned before real volunteer accounts are enabled.

## Project Status

**Development complete for several core features; deployment and beta testing are being prepared.**

The hospital's volunteer coordinator has approved beta testing with a group of 46 volunteers.

Following the initial beta, the coordinator has recommended expanding the platform to Labor and Delivery. The Emergency Department director has also expressed support for introducing the platform to ED volunteers.

These potential expansions have not yet been implemented.

## Security and Privacy

The repository excludes local database files, credentials, and other sensitive development artifacts.

The application is not yet production-hardened. Before real volunteer accounts are enabled, additional work is required on HTTPS, secure session management, rate limiting, password-reset email delivery, and deployment security.

No patient information should be entered into the application.

## Project Ownership

Independently designed and developed as a volunteer training initiative for St. Anthony North Hospital.

This repository documents an independent project and is not an official CommonSpirit Health software repository.