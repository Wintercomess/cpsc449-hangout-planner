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
    itinerary.service.js   Gemini itinerary generation
    wikivoyage.service.js  Wikivoyage destination guides (summary + places)
  models/            Mongoose schemas
    User.js          account (name, email, bcrypt passwordHash, googleId)
    Group.js         group + members with per-group role and invite code
  middleware/        404 + central error handler (auth / role checks go here later)
public/              UI mockup (plain HTML/CSS/JS, served at http://localhost:3000/)
  index.html         sign in / create account
  groups.html        my groups, create group, join with invite code
  group.html         one group: hangout voting, tasks, expenses, members
  js/mock-data.js    fake data the pages use instead of the API (for now)
```

### UI mockup

The pages in `public/` use fake data from `public/js/mock-data.js` and are **not connected to the API yet**. Changes you make in the UI only live in memory and reset on refresh. View them with `npm run dev` and open `http://localhost:3000/`, or just open `public/index.html` directly in a browser (no server or database needed).

### Adding a new endpoint

1. Write the handler in `src/controllers/<thing>.controller.js`
2. Map URLs to it in `src/routes/<thing>.routes.js`
3. Mount the route file in `src/routes/index.js`, e.g. `router.use('/groups', require('./group.routes'))`

Express 5 forwards errors thrown in `async` handlers to the error handler automatically, so there is no need for try/catch in every controller. Mongoose validation errors become `400`, bad ids become `400`, and duplicate keys become `409`.

## External APIs

| API | Used for | Key needed |
|---|---|---|
| LocationIQ | `GET /api/location/search?q=` geocoding | `LOCATIONIQ_API_KEY` |
| Gemini | `POST /api/itineraries/groups/:groupId` itinerary generation | `GEMINI_API_KEY` |
| Wikivoyage | `GET /api/guides` destination guides | none |

### Wikivoyage destination guides

`GET /api/guides/search?q=fullerton&limit=5` lists matching Wikivoyage articles (`title`, `snippet`, `url`).

`GET /api/guides?destination=Fullerton&types=see,do,eat,drink&limit=5` returns one destination guide:

```json
{
  "title": "Fullerton",
  "url": "https://en.wikivoyage.org/wiki/Fullerton",
  "summary": "Fullerton is an inland city in north Orange County...",
  "image": "https://thumb.wikimedia.org/...",
  "listings": {
    "see": [
      {
        "name": "Fullerton Arboretum",
        "description": "A collection of 4,000 plants from around the world on 26 acres...",
        "address": "1900 Associated Rd",
        "directions": "Yorba Linda exit off the 57 freeway",
        "hours": "8AM-4:30PM (extended hours in summer months)",
        "price": "Free - suggested $3 donation",
        "phone": "+1 714 278-3407",
        "url": "http://fullertonarboretum.org/",
        "coordinates": { "lat": 33.8872, "lng": -117.8828 }
      }
    ],
    "do": [], "eat": [], "drink": []
  },
  "guideSummary": "Wikivoyage guide for Fullerton: ...\nSee: Fullerton Arboretum, ...",
  "source": "Wikivoyage (CC BY-SA 4.0)"
}
```

- `types` (optional): any of `see, do, buy, eat, drink, sleep`. Default `see,do,eat,drink`.
- `limit` (optional): max places per type, 1-25, default 5.
- Destination names are matched with Wikivoyage search, so `los angeles` and `new york` work (disambiguation pages are skipped). Unknown places return `404`.
- Big cities such as Los Angeles and New York City put their places in district articles, so the main page can come back with empty `listings`. The summary is still returned.
- Responses are cached in memory for an hour.

The itinerary endpoint uses this automatically. If the request body has no `guideSummary`, it looks the destination up on Wikivoyage and passes the guide notes to Gemini. A failed lookup doesn't block the itinerary.

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
