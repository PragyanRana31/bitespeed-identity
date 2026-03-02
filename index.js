const identifyContact = require("./identify");
const express = require("express");
const pool = require("./db");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Create contacts table if not exists
const createTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        phoneNumber VARCHAR(20),
        email VARCHAR(255),
        linkedId INTEGER REFERENCES contacts(id),
        linkPrecedence VARCHAR(10) NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
        createdAt TIMESTAMP NOT NULL DEFAULT NOW(),
        updatedAt TIMESTAMP NOT NULL DEFAULT NOW(),
        deletedAt TIMESTAMP
      );
    `);

    console.log("Contacts table ready");
  } catch (error) {
    console.error("Error creating table:", error);
  }
};

app.post("/identify", identifyContact);
app.listen(PORT, async () => {
  await createTable();
  console.log(`Server running on port ${PORT}`);
});
