# Profile API Documentation

## Overview
The Profile entity extends the User model by storing additional personal information, preferences, and social links. Each profile has a one-to-one relationship with a User.

## Profile Schema

```javascript
{
  user: ObjectId (ref: User) - Required, Unique
  bio: String (max 500 chars)
  avatar: String (URL)
  phone: String
  dateOfBirth: Date
  gender: String (male, female, other, prefer not to say)
  address: {
    street: String
    city: String
    state: String
    country: String
    zipCode: String
  }
  socialLinks: {
    linkedin: String
    twitter: String
    github: String
    website: String
  }
  preferences: {
    language: String (default: 'en')
    timezone: String (default: 'UTC')
    notifications: {
      email: Boolean (default: true)
      sms: Boolean (default: false)
      push: Boolean (default: true)
    }
  }
  timestamps: true (createdAt, updatedAt)
}
```

## API Endpoints

### User Profile Endpoints (Authenticated Users)

#### Get My Profile
```
GET /api/profile/me
Authorization: Bearer {token}
```

#### Create/Update My Profile
```
POST /api/profile/me
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "bio": "Full-stack developer",
  "avatar": "https://example.com/avatar.jpg",
  "phone": "+1234567890",
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "socialLinks": {
    "github": "https://github.com/username"
  },
  "preferences": {
    "language": "en",
    "timezone": "America/New_York"
  }
}
```

#### Delete My Profile
```
DELETE /api/profile/me
Authorization: Bearer {token}
```

### Admin Profile Endpoints

#### Get All Profiles
```
GET /api/profile
Authorization: Bearer {adminToken}
```

#### Get Profile by User ID
```
GET /api/profile/user/:userId
Authorization: Bearer {adminToken}
```

#### Create Profile for User
```
POST /api/profile/user/:userId
Authorization: Bearer {adminToken}
Content-Type: application/json

Body: (same as create/update my profile)
```

#### Update Profile for User
```
PUT /api/profile/user/:userId
Authorization: Bearer {adminToken}
Content-Type: application/json

Body: (partial or full profile data)
```

#### Delete Profile for User
```
DELETE /api/profile/user/:userId
Authorization: Bearer {adminToken}
```

## Features

### ✅ Implemented
- One-to-one relationship with User
- Auto-populate user data on queries
- Cascade delete (profile deleted when user is deleted)
- Partial update support
- Admin management endpoints
- Phone number validation
- Gender options
- Social media links
- User preferences (language, timezone, notifications)
- Address information

### 🔄 Usage Flow

1. **User registers** → User account created
2. **User creates profile** → Additional info stored in Profile
3. **User updates profile** → Partial or full update
4. **Admin views all profiles** → Manage user profiles
5. **User deleted** → Profile automatically deleted (cascade)

## Testing with Postman

Import the `postman_collection.json` file which includes:
- **Profile Management** folder: User profile endpoints
- **Profile Management (Admin)** folder: Admin profile endpoints

### Test Sequence:
1. Register/Login as a user
2. Create your profile using `POST /api/profile/me`
3. Get your profile using `GET /api/profile/me`
4. Update specific fields using `POST /api/profile/me` (partial update)
5. Login as admin to view all profiles
6. Admin can manage any user's profile

## Example Responses

### Success Response (Create Profile)
```json
{
  "success": true,
  "message": "Profile created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "user": {
      "_id": "507f191e810c19729de860ea",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    },
    "bio": "Full-stack developer",
    "avatar": "https://example.com/avatar.jpg",
    "phone": "+1234567890",
    "gender": "male",
    "preferences": {
      "language": "en",
      "timezone": "America/New_York",
      "notifications": {
        "email": true,
        "sms": false,
        "push": true
      }
    },
    "createdAt": "2025-11-05T10:00:00.000Z",
    "updatedAt": "2025-11-05T10:00:00.000Z"
  }
}
```

### Error Response (Profile Not Found)
```json
{
  "success": false,
  "message": "Profile not found"
}
```

## Database Relationship

```
User (1) ←→ (1) Profile
- One user has one profile
- Profile references user via ObjectId
- Cascade delete on user removal
```

## Notes

- Profile is optional (users can exist without profiles)
- All fields except `user` are optional
- Phone number must match valid format
- Gender has predefined enum values
- Preferences have sensible defaults
- Social links support major platforms
- Timestamps automatically managed
