**Name:** Ashraf Uddin Fahim

**Student ID:** L2B7-0911

**Assignment: 02**

---

# 🧩 Project Name: DevPulse – Internal Tech Issue & Feature Tracker

**Live URL:** [Live URL](#)

DevPulse is a collaborative, raw-SQL powered backend platform designed for software teams to report bugs, suggest features, and coordinate resolutions efficiently. This API is built entirely without ORMs or Query Builders to demonstrate advanced relational database management and raw SQL proficiency.

---

## ✨ Features

- **Secure Authentication:** JWT-based stateless authentication. Passwords are encrypted using `bcrypt` (10 salt rounds).
- **Role-Based Access Control (RBAC):** Distinct permissions for `contributor` and `maintainer` roles.
  - _Contributors:_ Can register, log in, create issues, and view issues. Can only update their _own_ issues if the status is currently `open`.
  - _Maintainers:_ Have elevated privileges to update any issue field, delete issues, and change workflow statuses independently.
- **Advanced Filtering & Sorting:** Dynamic query building allowing users to filter issues by `type` and `status`, and sort them by `newest` or `oldest`.
- **Raw SQL Implementation:** 100% native `pg` driver interactions (`pool.query()`). No ORMs, query builders, or `JOIN` keywords used (utilizes batched parallel queries for nested relational data).
- **Standardized API Responses:** Centralized error handling and unified standard response formatting (`success`, `message`, `data`/`errors`).

---

## 🛠️ Technology Stack

| Technology       | Note                                                                                  |
| :--------------- | :------------------------------------------------------------------------------------ |
| **Node.js**      | LTS runtime (24.x or higher) - My Node.js Version is v24.15.0                                   |
| **TypeScript**   | Strict typing across all controllers, middlewares, and request interfaces             |
| **Express.js**   | Modular router architecture                                                           |
| **PostgreSQL**   | Relational database accessed via native `pg` driver only                              |
| **Raw SQL**      | Direct `pool.query()` calls; absolutely no query builders, ORMs or SQL JOINs utilized |
| **bcrypt**       | Password hashing algorithm, salt rounds between 8 and 12                              |
| **jsonwebtoken** | JWT generation & verification (standard tokens)                                       |

---

## 🚀 Local Setup Steps

**1. Clone the repository:**

```bash
git clone https://github.com/au-fahim/L2B7__Assignment_2.git
cd L2B7__Assignment_2
```

**2. Install dependencies:**

```bash
npm install
```

**3. Configure Environment Variables:**
Create a `.env` file in the root directory and add the following keys:

```bash
PORT=5000
DATABASE_URL=postgres://<username>:<password>@<host>:<port>/<dbname>
JWT_SECRET=your_super_secret_jwt_key
```

**4. Set up the Database Schema:**

Run the database initialization script to automatically execute the raw SQL and create the `users` and `issues` tables.

```bash
npm run init-db
```

**5. Start the Application:**

```bash
npm run dev
```

The server should now be running on [`http://localhost:5000`](http://localhost:5000).

---

## 📡 API Endpoint List

**🔐 Authentication Module**

| Method | Endpoint           | Access | Description                                 |
| :----- | :----------------- | :----- | :------------------------------------------ |
| `POST` | `/api/auth/signup` | Public | Register a new user                         |
| `POST` | `/api/auth/login`  | Public | Authenticate a user and return a signed JWT |

**🗄️ Issues Module**

| Method   | Endpoint          | Access                                    | Description                                                              |
| :------- | :---------------- | :---------------------------------------- | :----------------------------------------------------------------------- |
| `POST`   | `/api/issues`     | Protected (`Maintainer` or `Contributor`) | Create a new issue (bug or feature request)                              |
| `GET`    | `/api/issues`     | Public                                    | Fetch all issues (Supports `?type=`, `?status=`, `?sort=`)               |
| `GET`    | `/api/issues/:id` | Public                                    | Retrieve a single issue by ID (Includes reporter details)                |
| `PATCH`  | `/api/issues/:id` | Protected (`Maintainer` or `Contributor`) | Update an issue (Contributors: own open issues / Maintainers: any issue) |
| `DELETE` | `/api/issues/:id` | Protected (Maintainer Only)               | Delete an issue permanently                                              |

---

## 🗃️ Database Schema Summary

The database strictly uses PostgreSQL and consists of two primary tables:

`users` Table

| Column       | Type           | Constraints                 | Description                   |
| :----------- | :------------- | :-------------------------- | :---------------------------- |
| `id`         | `SERIAL`       | `PRIMARY KEY`               | Unique identifier             |
| `name`       | `VARCHAR(100)` | `NOT NULL`                  | User's full name              |
| `email`      | `VARCHAR(255)` | `UNIQUE, NOT NULL`          | Login identifier              |
| `password`   | `VARCHAR(255)` | `NOT NULL`                  | Bcrypt hashed password        |
| `role`       | `VARCHAR(20)`  | `NOT NULL`                  | `contributor` or `maintainer` |
| `created_at` | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Record creation time          |
| `updated_at` | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Record last updated time      |

`issues` Table

| Column        | Type           | Constraints                 | Description                       |
| ------------- | -------------- | --------------------------- | --------------------------------- |
| `id`          | `SERIAL`       | `PRIMARY KEY`               | Unique identifier                 |
| `title`       | `VARCHAR(255)` | `NOT NULL`                  | Issue title                       |
| `description` | `TEXT`         | `NOT NULL`                  | Detailed explanation              |
| `type`        | `VARCHAR(50)`  | `NOT NULL`                  | `bug` or `feature_request`        |
| `status`      | `VARCHAR(50)`  | `DEFAULT 'open'`            | `open`, `in_progress`, `resolved` |
| `reporter_id` | `INTEGER`      | `REFERENCES users(id)`      | Foreign key to the creator        |
| `created_at`  | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Record creation time              |
| `updated_at`  | `TIMESTAMP`    | `DEFAULT CURRENT_TIMESTAMP` | Record last updated time          |
