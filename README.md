# User Management System - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [File Structure](#file-structure)
3. [Architecture & Technologies](#architecture--technologies)
4. [Workflow](#workflow)
5. [Key Concepts & Keywords](#key-concepts--keywords)

---

## Project Overview

This is a **full-stack user management system** built with Django (backend) and React (frontend). It provides user authentication, registration with OTP verification, role-based access control (RBAC), and a complete CRUD interface for managing users.

**Core Features:**
- Email-based JWT authentication
- OTP (One-Time Password) registration flow
- Role-based access control (admin, user, guest)
- User CRUD operations (create, read, update, delete)
- Profile management with password change

---

## File Structure

### Backend (`myproject/`)

| File | Purpose |
|------|---------|
| `manage.py` | Django management command entry point |
| `myproject/settings.py` | Django configuration (auth, JWT, CORS, email, MariaDB) |
| `myproject/urls.py` | Root URL routing |
| `myproject/email_backends.py` | Custom SMTP backend for sending emails |
| `myproject/.env` | Environment variables (email credentials) |
| `accounts/models.py` | Database models (User, OTP, UserPermission) |
| `accounts/views.py` | API views (authentication, user CRUD) |
| `accounts/serializers.py` | DRF serializers for data validation |
| `accounts/urls.py` | App-level URL routing |
| `accounts/backends.py` | Custom authentication backend (email login) |
| `accounts/admin.py` | Django admin configuration |
| `accounts/migrations/` | Database schema migrations |

### Frontend (`frontend/`)

| File | Purpose |
|------|---------|
| `package.json` | Node dependencies and scripts |
| `vite.config.js` | Vite configuration with API proxy |
| `index.html` | HTML entry point |
| `src/main.jsx` | React application entry point |
| `src/App.jsx` | Main app with routing setup |
| `src/App.css` | App-level styles |
| `src/index.css` | Global styles |
| `src/context/AuthContext.jsx` | Global authentication state management |
| `src/services/api.js` | Axios HTTP client configuration |
| `src/pages/Login.jsx` | Login page component |
| `src/pages/Register.jsx` | Registration page with OTP flow |
| `src/pages/Dashboard.jsx` | Main dashboard with user management UI |

---

## Architecture & Technologies

### Backend Stack

| Technology | Purpose |
|------------|---------|
| **Django** | Python web framework for building the REST API |
| **Django REST Framework (DRF)** | Toolkit for building RESTful APIs |
| **djangorestframework-simplejwt** | JWT (JSON Web Token) authentication |
| **django-cors-headers** | Cross-Origin Resource Sharing for frontend-backend communication |
| **MariaDB/MySQL** | Relational database server |
| **Gmail SMTP** | Email service for sending OTPs |

### Frontend Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI library for building the user interface |
| **React Router DOM 7** | Client-side routing and navigation |
| **Axios** | HTTP client for API calls |
| **Vite** | Fast build tool and development server |
| **ESLint** | Code linting for maintaining quality |

---

## Workflow

### 1. User Registration Flow

```
[User enters email] → POST /api/auth/otp/send/ → [Server generates OTP]
                                                    ↓
                                        [OTP sent via email (or console)]
                                                    ↓
[User enters OTP + details] → POST /api/auth/otp/verify/
                                                    ↓
                                        [Server validates OTP, creates user]
                                                    ↓
                                        [User redirected to login]
```

### 2. User Login Flow

```
[User enters email + password] → POST /api/auth/login/
                                            ↓
                            [Backend validates credentials]
                                            ↓
                            [Returns JWT tokens + user data]
                                            ↓
[Frontend stores tokens in localStorage]
                                            ↓
[AuthContext updated with user data]
                                            ↓
[Redirect to Dashboard]
```

### 3. User Management Flow (Admin)

```
[Admin views user list] → GET /api/users/
                                    ↓
                        [Returns all users (filtered by permission)]
                                    ↓
[Admin performs action: create/edit/delete/role change]
                                    ↓
[PATCH/POST/DELETE to appropriate endpoint]
                                    ↓
[Backend enforces permissions]
                                    ↓
[Returns updated data or success message]
```

### 4. Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React UI      │ ←→  │   Vite Dev      │ ←→  │    Django      │
│   Components    │     │   Server        │     │    REST API    │
│                 │     │   (Proxy)       │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          ↓
                                                 ┌─────────────────┐
                                                 │                 │
                                                 │    MariaDB      │
                                                 │   Database      │
                                                 │                 │
                                                 └─────────────────┘
```

---

## Key Concepts & Keywords

### Authentication & Authorization

| Term | Definition |
|------|------------|
| **JWT (JSON Web Token)** | A compact, URL-safe token that contains claims about the user. Used for stateless authentication. Contains access token (short-lived) and refresh token (long-lived). |
| **Access Token** | Short-lived token (1 hour) used to authorize API requests. Included in Authorization header. |
| **Refresh Token** | Long-lived token (7 days) used to obtain new access tokens without re-login. |
| **Authentication** | The process of verifying who a user is (login with credentials). |
| **Authorization** | The process of determining what a user is allowed to do (permissions/roles). |
| **OTP (One-Time Password)** | A 6-digit code sent to email for verification. Expires in 10 minutes. Used during registration to verify email ownership. |

### Role-Based Access Control (RBAC)

| Term | Definition |
|------|------------|
| **RBAC** | Access control mechanism where permissions are assigned to roles, not directly to users. |
| **Role** | A named set of permissions (admin, user, guest). Users inherit permissions from their role. |
| **Permission** | A specific capability (e.g., can_manage_users, can_delete_users). |
| **Admin** | Highest role with full control over users. Can create, edit, delete, change roles. |
| **User** | Standard role with limited access (view own profile, basic operations). |
| **Guest** | Limited role with minimal permissions. |

### Backend Concepts

| Term | Definition |
|------|------------|
| **Django** | High-level Python web framework that encourages rapid development. |
| **Django REST Framework (DRF)** | Extension of Django for building REST APIs. Provides serializers, views, authentication classes. |
| **Serializer** | Converts Django models to JSON and validates incoming data. |
| **View/ViewSet** | API endpoint logic that handles requests and returns responses. |
| **Model** | Django's database abstraction - defines database schema in Python. |
| **URL Routing** | Maps URLs to views in Django. |
| **Custom User Model** | Extends Django's AbstractUser to add custom fields (role, phone, address, bio). |
| **Authentication Backend** | Custom logic for authenticating users (email-based in this project). |
| **Permission Class** | DRF class that checks if user has permission to access an endpoint. |
| **CORS (Cross-Origin Resource Sharing)** | Mechanism that allows frontend (different origin) to make requests to backend. |
| **SMTP (Simple Mail Transfer Protocol)** | Protocol for sending emails. Configured with Gmail in this project. |

### Frontend Concepts

| Term | Definition |
|------|------------|
| **React** | JavaScript library for building user interfaces using components. |
| **Component** | Reusable UI piece (Login, Register, Dashboard are components). |
| **React Router** | Library for client-side routing (navigation without page reload). |
| **Context API** | React's way of passing data through the component tree (AuthContext for auth state). |
| **Axios** | HTTP client library for making API requests. |
| **Vite** | Modern build tool that provides fast development server and optimized production build. |
| **API Proxy** | Vite config that forwards /api requests to Django backend (avoids CORS issues in dev). |
| **localStorage** | Browser storage for persisting JWT tokens across sessions. |
| **State Management** | Managing application state (user data, loading states) - using Context API here. |

### Database Concepts

| Term | Definition |
|------|------------|
| **MariaDB/MySQL** | Relational database server. MariaDB 12.2 is used in this project. |
| **Model Migration** | Django's way of tracking database schema changes over time. |
| **ForeignKey** | Database relationship linking one model to another (UserPermission → User). |

### Security Terms

| Term | Definition |
|------|------------|
| **Password Hashing** | Converting plain password to irreversible hash before storing (Django uses PBKDF2). |
| **Token Expiry** | Time limit on JWT tokens to limit damage if token is compromised. |
| **HTTP Status Codes** | Standard response codes (200=OK, 401=Unauthorized, 403=Forbidden, 404=Not Found). |

---

## API Endpoints Summary

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login with email/password
- `POST /api/auth/logout/` - Logout

### OTP
- `POST /api/auth/otp/send/` - Send OTP to email
- `POST /api/auth/otp/verify/` - Verify OTP and complete registration

### Users
- `GET /api/users/` - List users
- `POST /api/users/create/` - Create user (admin)
- `GET /api/users/<id>/` - Get user details
- `PATCH /api/users/<id>/` - Update user
- `DELETE /api/users/<id>/` - Delete user (admin)
- `GET /api/users/me/` - Get current user
- `PATCH /api/users/me/update/` - Update own profile
- `POST /api/users/me/change-password/` - Change password
- `POST /api/users/role/update/` - Change user role (admin)
- `POST /api/users/toggle-active/` - Activate/deactivate user (admin)

---

## Running the Project

### Prerequisites
- Python 3.11+
- Node.js 18+
- MariaDB 12.2 (installed and running)

### Database Setup (MariaDB)
1. Ensure MariaDB service is running
2. Create the database:
```bash
mysql -u root -p97528Yguee!! -e "CREATE DATABASE IF NOT EXISTS usermanagement CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```
3. Install PyMySQL:
```bash
pip install pymysql
```
4. Run migrations:
```bash
cd myproject
python manage.py migrate
```

### Admin Credentials
- Username: `admin`
- Password: `admin123`

### Backend
```bash
cd myproject
python manage.py runserver
```
Runs on `http://localhost:8000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on `http://localhost:5173`

### phpMyAdmin (Optional)
- Access: `http://localhost/phpmyadmin`
- Username: `root`
- Password: `97528Yguee!!`

---

*Generated on 2026-03-27*#   u s e r M a n a g e m e n t  
 