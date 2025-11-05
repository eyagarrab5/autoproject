const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
      trim: true
    },
    avatar: {
      type: String,
      default: 'https://via.placeholder.com/150'
    },
    phone: {
      type: String,
      match: [
        /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        'Please provide a valid phone number'
      ]
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer not to say'],
      default: 'prefer not to say'
    },
    address: {
      street: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        trim: true
      },
      state: {
        type: String,
        trim: true
      },
      country: {
        type: String,
        trim: true
      },
      zipCode: {
        type: String,
        trim: true
      }
    },
    socialLinks: {
      linkedin: {
        type: String,
        trim: true
      },
      twitter: {
        type: String,
        trim: true
      },
      github: {
        type: String,
        trim: true
      },
      website: {
        type: String,
        trim: true
      }
    },
    preferences: {
      language: {
        type: String,
        default: 'en'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        sms: {
          type: Boolean,
          default: false
        },
        push: {
          type: Boolean,
          default: true
        }
      }
    }
  },
  {
    timestamps: true
  }
);

// Populate user data when querying profile
profileSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name email role isActive'
  });
  next();
});

module.exports = mongoose.model('Profile', profileSchema);
