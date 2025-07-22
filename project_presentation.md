# Employee Management System

## Project Overview
- **Project Name**: Employee Management System
- **Type**: Web Application
- **Purpose**: Streamline employee attendance and leave management
- **Tech Stack**:
  - Frontend: HTML, CSS, JavaScript
  - Backend: Node.js, Express.js
  - Database: MongoDB
  - Authentication: JWT

---

## Key Features

### 1. User Authentication
- Secure login system with JWT
- Role-based access control (Admin/Employee)
- Session management

### 2. Attendance Management
- Clock in/out functionality
- Real-time attendance tracking
- Attendance history

### 3. Leave Management
- Leave request submission
- Leave status tracking
- Leave history

---

## Technical Architecture

### Frontend
- Responsive design
- Interactive UI/UX
- Client-side validation

### Backend
- RESTful API endpoints
- MVC architecture
- Secure authentication middleware

### Database
- MongoDB for data persistence
- Schema-based data modeling
- Efficient querying

---

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - New user registration

### Attendance
- `POST /api/attendance/clock-in` - Record check-in
- `POST /api/attendance/clock-out` - Record check-out
- `GET /api/attendance/history` - View attendance history

### Leave Management
- `POST /api/leave/request` - Submit leave request
- `GET /api/leave/history` - View leave history
- `PUT /api/leave/status/:id` - Update leave status (Admin)

---

## Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Input validation
- CORS protection
- Environment variables for sensitive data

---

## Project Structure
```
track1/
├── server.js          # Main application file
├── package.json      # Dependencies and scripts
├── .env              # Environment variables
└── public/           # Frontend files
    ├── css/          # Stylesheets
    ├── js/           # Client-side scripts
    ├── index.html    # Login page
    └── admin-dashboard.html  # Admin interface
```

---

## Setup & Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start the server: `npm start`
5. Access the application at `http://localhost:3001`

---

## Future Enhancements
- Email notifications
- Reports generation
- Mobile application
- Advanced analytics
- Multi-language support

---

## Thank You

Questions?
