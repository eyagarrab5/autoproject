# AutoProject (Car Rental Microservices)

AutoProject is a Node.js microservices project for a car rental workflow. It includes service discovery, an API gateway, and four business services (Auth, Cars, Payment, Reservation). The easiest way to run everything is with Docker Compose.

## Services

| Service | Folder | Purpose |
|--------:|--------|---------|
| Discovery | `services/discovery` | Simple service registry (in-memory) |
| Gateway | `services/gateway` | Proxies requests to microservices via Discovery |
| Auth | `services/auth` | Users, profiles, auth, password reset, activity logs, login history |
| Cars | `services/cars` | Cars (voitures) + maintenance (entretiens) |
| Payment | `services/payment` | Payments + Socket.IO events |
| Reservation | `services/reservation` | Reservations + contracts (PDF) + email sending |

## Ports

| Service | Port | URL |
|--------:|-----:|-----|
| MongoDB | 27017 | mongodb://localhost:27017 |
| Discovery | 4000 | http://localhost:4000 |
| Gateway | 5000 | http://localhost:5000 |
| Auth | 3001 | http://localhost:3001 |
| Cars | 3002 | http://localhost:3002 |
| Payment | 3003 | http://localhost:3003 |
| Reservation | 3004 | http://localhost:3004 |

## Run with Docker (recommended)

From the project root:

```bash
docker compose up --build
```

To stop everything:

```bash
docker compose down
```

To stop one service only (keep the others running):

```bash
docker compose stop cars
```

To start it again:

```bash
docker compose start cars
```

More details: see `HOW_TO_RUN.md`.

## API access (through Gateway)

All client requests should go through the Gateway (port 5000). The Gateway uses a service-name prefix to route to the correct microservice:

| Prefix | Service |
|--------|---------|
| `/auth-service/*` | Auth |
| `/cars-service/*` | Cars |
| `/payment-service/*` | Payment |
| `/reservation-service/*` | Reservation |

Example:

```text
GET http://localhost:5000/cars-service/voitures
```

## Authentication flow

### Register

```text
POST http://localhost:5000/auth-service/auth/register
```

Register returns a JWT token in `data.token`.

### Login (email + password + token required)

```text
POST http://localhost:5000/auth-service/auth/login
```

Body (all fields required):

```json
{
  "email": "john@example.com",
  "password": "password123",
  "token": "<token returned from register>"
}
```

### Using the token

For protected routes, send:

```text
Authorization: Bearer <token>
```

## Activity logs + Login history

The Auth service stores two audit streams in MongoDB:

- **Activity logs**: records actions like register/login/password reset.
- **Login history**: records login attempts, IP address, and user-agent (OS/browser guessed from the User-Agent header).

These are available via Auth routes:

```text
GET http://localhost:5000/auth-service/activity/...
GET http://localhost:5000/auth-service/login-history/...
```

## Postman

Import `postman_collection.json` into Postman.

The collection is configured to call the Gateway using the variable `{{gatewayUrl}}` (default `http://localhost:5000`).

## Email configuration (Auth + Reservation)

Email sending is handled with Nodemailer:

- Auth (password reset emails) uses `EMAIL_*` variables from `services/auth/.env`.
- Reservation (contract emails with PDF attachment) uses `MAIL_*` variables from `services/reservation/.env`.

Templates are provided:

- `services/auth/.env.example`
- `services/reservation/.env.example`

In Docker runs, `docker-compose.yml` loads these `.env` files into the corresponding containers.

## Troubleshooting

- If Gateway routes fail when Discovery is down: Discovery is required because the Gateway fetches service addresses from it.
- If a protected endpoint returns 401: ensure your request includes `Authorization: Bearer <token>` and all services share the same `JWT_SECRET`.
- If password reset email fails: check Auth container logs; missing `EMAIL_USER` / `EMAIL_PASSWORD` will cause SMTP auth errors.
