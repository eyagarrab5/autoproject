# User Authentication and CRUD API

A complete RESTful API built with Express.js and MongoDB featuring user authentication and CRUD operations.

## Features

- ✅ User Registration and Login
- ✅ JWT-based Authentication
- ✅ Password Hashing with bcrypt
- ✅ User CRUD Operations (Admin only)
- ✅ Role-based Access Control (User/Admin)
- ✅ Input Validation
- ✅ MongoDB Integration
- ✅ Docker and Docker Compose Support

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: bcryptjs for password hashing
- **Containerization**: Docker, Docker Compose

## Project Structure

```
autoproject/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   └── user.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js
│   ├── models/
│   │   └── User.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── user.routes.js
│   └── server.js
├── .env
├── .gitignore
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Docker and Docker Compose (optional)

### Installation (Without Docker)

1. Clone the repository:
```bash
git clone <repository-url>
cd autoproject
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Copy `.env` file and update the values:
   - Update `MONGODB_URI` if using local MongoDB
   - Change `JWT_SECRET` to a secure random string

4. Start MongoDB (if running locally):
```bash
mongod
```

5. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

### Installation (With Docker)

1. Clone the repository:
```bash
git clone <repository-url>
cd autoproject
```

2. Build and start the containers:
```bash
docker-compose up -d
```

3. Check if containers are running:
```bash
docker-compose ps
```

4. View logs:
```bash
docker-compose logs -f
```

5. Stop the containers:
```bash
docker-compose down
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register a new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| PUT | `/api/auth/updatepassword` | Update password | Private |

### User Routes (Admin Only)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Private/Admin |
| GET | `/api/users/:id` | Get user by ID | Private/Admin |
| POST | `/api/users` | Create new user | Private/Admin |
| PUT | `/api/users/:id` | Update user | Private/Admin |
| DELETE | `/api/users/:id` | Delete user | Private/Admin |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/health` | Check server status | Public |

## API Usage Examples

### Register a User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User

```bash
GET /api/auth/me
Authorization: Bearer YOUR_JWT_TOKEN
```

### Get All Users (Admin Only)

```bash
GET /api/users
Authorization: Bearer ADMIN_JWT_TOKEN
```

### Update User (Admin Only)

```bash
PUT /api/users/:id
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "admin",
  "isActive": true
}
```

### Delete User (Admin Only)

```bash
DELETE /api/users/:id
Authorization: Bearer ADMIN_JWT_TOKEN
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3000 |
| NODE_ENV | Environment (development/production) | development |
| MONGODB_URI | MongoDB connection string | mongodb://mongodb:27017/userdb |
| JWT_SECRET | Secret key for JWT | your_jwt_secret_key_change_this_in_production |
| JWT_EXPIRE | JWT expiration time | 7d |

## Docker Commands

```bash
# Build and start containers
docker-compose up -d

# Build containers without cache
docker-compose build --no-cache

# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v

# View logs
docker-compose logs -f

# Execute commands in container
docker-compose exec app sh
```

## Security Features

- Password hashing using bcryptjs
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Protected routes with middleware
- Environment variable configuration

## License

ISC
