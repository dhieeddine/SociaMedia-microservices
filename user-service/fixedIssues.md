# User Service - Security and Refactoring Fixes

This document outlines the security vulnerabilities and architectural issues identified and resolved during the code review of the `user-service`.

## 1. Authentication & Authorization Added (Critical Fix)
**Issue:** Previously, mutating routes (like updating profiles, deleting accounts, following/unfollowing) blindly trusted the client request. Anyone could impersonate another user by changing the `userId` in the payload.
**Fix:**
- Installed the `jsonwebtoken` package.
- Implemented an `authMiddleware` to securely verify incoming tokens.
- Modified the `/register` and `/login` routes to generate and return a signed JSON Web Token (JWT).
- Protected the following endpoints to ensure the requester is the actual account owner or authenticated user:
  - `POST /api/users/:id/follow`
  - `POST /api/users/:id/unfollow`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`

## 2. NoSQL Injection / ReDoS Prevented (High Fix)
**Issue:** The `GET /api/users/search?q=...` endpoint passed raw user input directly into a MongoDB `$regex` query, leaving the database vulnerable to Regular Expression Denial of Service (ReDoS) attacks.
**Fix:**
- Implemented an `escapeRegex` utility function to sanitize user input by escaping all special regex characters before applying them to the database query.

## 3. Race Conditions Fixed in Follow Logic (Medium Fix)
**Issue:** The follow/unfollow logic was using `.includes()` to check arrays in application memory before using `$push` or `$pull` in MongoDB. This created a race condition where multiple rapid requests could result in duplicated follower entries.
**Fix:**
- Removed the memory-based checks.
- Refactored the database calls to exclusively use native MongoDB atomic operators (`$addToSet` for adding unique values, and `$pull` for removing them).

## 4. Hardcoded Service URLs Removed (Medium Fix)
**Issue:** The notification service was being called with a hardcoded `http://localhost:3002/` URL, which would break upon containerization or deployment.
**Fix:**
- Replaced the hardcoded string with an environment variable `process.env.NOTIFICATION_SERVICE_URL`, keeping the localhost URL solely as a local fallback.

## 5. Password Validation Added (Low Fix)
**Issue:** User registration lacked basic password strength/length requirements.
**Fix:**
- Added a simple validation step in the `/register` route ensuring passwords are at least 6 characters long.

## 6. Test Suite Restored
**Issue:** The unit tests (`__tests__/users.test.js`) were failing because they attempted to mock `bcrypt` instead of the actually installed `bcryptjs`.
**Fix:**
- Updated the mock references in the test file to correctly point to `bcryptjs`. All tests now pass successfully.
