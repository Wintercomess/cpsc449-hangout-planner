# cpsc449-hangout-planner

CPSC 449 group project: backend for a group hangout planner (Node.js + Express + MongoDB).

Friend groups can create a group, invite people with a code, vote on dates/times/places, split expenses, and claim tasks (who drives, who brings food).

**Team:** Jairo Santos, William Wang, Quoc Nguyen

## Tech stack

- Node.js + Express 5 (API)
- MongoDB Atlas (database)
- Mongoose (schemas and validation)

## Getting started

Requires Node.js 20 or newer.

```bash
git clone https://github.com/Wintercomess/cpsc449-hangout-planner.git
cd cpsc449-hangout-planner
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Open `.env` and set `MONGODB_URI` to the Atlas connection string (ask in the group chat, never commit it). Then:

```bash
npm run dev     # restarts automatically when you save a file
# or
npm start
```

You should see `MongoDB connected` and `Server running on http://localhost:3000`.
Check it in a browser or Postman: `GET http://localhost:3000/api/health` returns

```json
{ "status": "ok", "db": "connected", "uptime": 3 }
```

## Project structure

```
src/
  server.js          loads .env, connects to MongoDB, starts the server
  app.js             Express app: middleware + routes (no DB code here)
  config/db.js       MongoDB connection
  routes/            URL -> controller mapping (all mounted under /api)
  controllers/       request handlers: read req, call models/services, send res
  services/          business logic shared between controllers (e.g. cost splitting)
  models/            Mongoose schemas
    User.js          account (name, email, bcrypt passwordHash, googleId)
    Group.js         group + members with per-group role and invite code
  middleware/        404 + central error handler (auth / role checks go here later)
```

### Adding a new endpoint

1. Write the handler in `src/controllers/<thing>.controller.js`
2. Map URLs to it in `src/routes/<thing>.routes.js`
3. Mount the route file in `src/routes/index.js`, e.g. `router.use('/groups', require('./group.routes'))`

Express 5 forwards errors thrown in `async` handlers to the error handler automatically, so there is no need for try/catch in every controller. Mongoose validation errors become `400`, bad ids become `400`, and duplicate keys become `409`.

## Roles

Roles belong to a user's **membership in a group**, not to the account, so someone can be an owner in one group and a member in another. They're stored in `Group.members[].role`:

| Role | Can do |
|---|---|
| owner | create/delete the group, manage members and roles |
| organizer | create hangouts, finalize votes, assign tasks |
| member | suggest options, vote, claim tasks, add expenses |

When a group is created, its `createdBy` user is automatically added as the owner. `group.getMemberRole(userId)` returns that user's role (or `null`), for use in role-check middleware.

## Git workflow

Work on your own branch and open a pull request into `main`:

```bash
git checkout -b feature/groups-api
# ...make changes...
git add .
git commit -m "Add POST /api/groups"
git push -u origin feature/groups-api
```
