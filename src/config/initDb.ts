import pool from "./db";

const createTables = async () => {
  const usersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const issuesTableQuery = `
    CREATE TABLE IF NOT EXISTS issues (
      id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      description TEXT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request')),
      status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
      reporter_id INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(usersTableQuery);
    await pool.query(issuesTableQuery);
    console.log("Tables created successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Error creating tables:", err);
    process.exit(1);
  }
};

createTables();
