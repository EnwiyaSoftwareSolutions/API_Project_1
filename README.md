# API_Project_1

## Appwrite hosting

This API is set up to run as an Appwrite Function with the Express app exported from `appwrite-function.js`.

- Build command: `npm install`
- Entrypoint: `appwrite-function.js`

Required environment variables:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `APPWRITE_USER_COLLECTION_ID`
- `APPWRITE_REVIEW_COLLECTION_ID`
- `APPWRITE_USER_REGISTER`
- `APPWRITE_BLOG` (blog post collection)
- `APPWRITE_BLOG_AUTHOR_COLLECTION_ID`
- `AUTH_TOKEN_NUM` (high-entropy JWT signing secret; never commit it)
- `AUTH_TOKEN_EXPIRY` (optional; defaults to `1h`)

## Blog and JWT authentication

Create the Appwrite collections and attributes documented in [blogPhaseImplament.md](./blogPhaseImplament.md) before calling the blog routes. Add unique indexes for usernames, emails, post slugs, and author slugs. Public blog routes return only active authors and published posts; post/author changes require a Bearer JWT whose account has the `editor` or `admin` role.

Register with `POST /register` using `username`, `email`, `password` (8-72 UTF-8 bytes), `firstName`, and `lastName`. Sign in with `POST /login` using `{ "username": "...", "password": "..." }` (or use `email` instead of `username`). Registration creates a regular `user` account and never grants editorial permissions. Provision editor/admin roles only through a trusted administrative process. Protected requests must send `Authorization: Bearer <token>`.
