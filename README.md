# Login and User Management System

A secure and scalable login and user management system built with Node.js, Express, and MongoDB. This system provides user authentication, registration, and session management capabilities.

## Features

- User registration with email and password
- Secure login with JWT (JSON Web Tokens)
- Password hashing using bcrypt
- RESTful API endpoints
- MongoDB for data storage
- CORS enabled for cross-origin requests
- Environment variable configuration

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt for password hashing
- **Environment Management**: dotenv

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Jatin291/tracking_system11.git
   cd tracking_system11
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   PORT=3000
   ```

4. Start the server:
   ```bash
   npm start
   ```

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - User login
- `GET /api/profile` - Get user profile (protected route)

## Project Structure

```
.
├── node_modules/       # Dependencies
├── public/             # Frontend files
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   └── index.html      # Main HTML file
├── .env                # Environment variables
├── package.json        # Project dependencies and scripts
├── server.js           # Main server file
└── README.md           # Project documentation
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any queries, please contact the project maintainer.

---

**Note**: Make sure to never commit sensitive information like `.env` files or API keys to version control.
