const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

let db;
const dbPath = path.join(__dirname, "userData.db");

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server has been started");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

app.post("/register", async (req, res) => {
  const { username, name, password, gender, location } = req.body;
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser !== undefined) {
    res.status(400);
    res.send("User already exists");
  } else if (password.length < 5) {
    res.status(400);
    res.send("Password is too short");
  } else {
    const hashedPassword = await bcrypt.hash(password, 8);
    const createUserQuery = `
        INSERT INTO user (username, name, password, gender, location)
        VALUES (
            '${username}',
            '${name}',
            '${hashedPassword}',
            '${gender}',
            '${location}'
        )
      `;
    const dbResponse = await db.run(createUserQuery);
    res.status(200);
    res.send("User created successfully");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser !== undefined) {
    const passwordCompare = await bcrypt.compare(password, getUser.password);
    if (passwordCompare) {
      res.status(200);
      res.send("Login success!");
    } else {
      res.status(400);
      res.send("Invalid password");
    }
  } else {
    res.status(400);
    res.send("Invalid user");
  }
});

app.put("/change-password", async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser !== undefined) {
    const oldPasswordIsCorrect = await bcrypt.compare(
      oldPassword,
      getUser.password
    );
    if (oldPasswordIsCorrect) {
      if (newPassword.length < 5) {
        res.status(400);
        res.send("Password is too short");
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updateUserQuery = `
        UPDATE user SET
            password = '${hashedPassword}'
        WHERE username = '${username}'
      `;
        const dbResponse = await db.run(updateUserQuery);
        res.status(200);
        res.send("Password updated");
      }
    } else {
      res.status(400);
      res.send("Invalid current password");
    }
  } else {
    res.status(400);
    res.send("Invalid User");
  }
});

module.exports = app;
