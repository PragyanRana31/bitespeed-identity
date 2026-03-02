# Bitespeed Identity Reconciliation

A backend service for Bitespeed's identity reconciliation task. This service helps consolidate multiple contact entries (emails and phone numbers) into a single customer identity.

## Features

- **Identify Endpoint**: `/identify` (POST) accepts `email` and `phoneNumber`.
- **Identity Consolidation**: 
  - Automatically links contacts sharing the same email or phone number.
  - Maintains a single "primary" contact and multiple "secondary" contacts.
  - Automatically converts newer primary contacts to secondary if they overlap with an existing identity.
- **PostgreSQL Database**: Uses a robust relational schema to manage contact links and precedence.

## API Specification

### POST `/identify`

**Request Body:**
```json
{
  "email": "morpheus@matrix.com",
  "phoneNumber": "101101"
}
```

**Response Body:**
```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["morpheus@matrix.com"],
    "phoneNumbers": ["101101"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Setup and Installation

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file with your PostgreSQL connection string:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   PORT=3000
   ```
4. **Start the server**:
   ```bash
   npm start
   ```

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM/Query Builder**: `pg` (node-postgres)

##Deployed Link on Render
https://bitespeed-identity-i52a.onrender.com/identify
