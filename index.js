const express = require("express");
const {
  writeData,
  readData,
  getContacts,
  removeallContacts,
  deleteContactById,
} = require("./helper/csvoperations");
const { v4: uuidv4 } = require("uuid");
const rateLimiter = require("./helper/ratelimitor");
const validateInput = require("./helper/validateInfo");

const app = express();
app.use(express.json());

// Middleware to read CSV data when the server starts
app.use(async (req, res, next) => {
  try {
    //await readData(); // Read data once at server startup
    const ip = req.ip;
    const url = req.url;
    const method = req.method;
    const date = new Date().toDateString();
    const time = new Date().toTimeString();

    const flag = rateLimiter(ip);

    if (flag) {
      return res
        .status(429)
        .end("Too many requests, try again after some time");
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
});

app.get("/", (req, res) => {
  return res.status(200).end(`
    Welcome to the contact book

    Pages you can try:

    1. GET      /                                           - for home Route,
    2. GET      /contacts?order=asc|desc                    - to get all contacts sorted by firstname,
    3. GET      /contacts?sort=createdAt&order=asc|desc     - to get all contacts sorted by created date,
    4. GET      /contacts?sort=lastname&order=asc|desc      - to get all contacts sorted by lastname,
    5. GET      /contacts/:id                               - to get a contact by id,
    6. GET      /contacts/search?q=                         - to search contacts (Fuzzy search),
    7. POST     /createContact                              - to add a new contact,
    8. PATCH    /contacts/:id                               - to update a contact,
    9. DELETE   /removeallContacts                          - to delete all contacts,
    10. DELETE   /deleteContact/:id                         - to delete a contact by id,
    `);
});

// Route to get contacts sorted by name
app.get("/contacts", async (req, res) => {
  const { sort, order } = req.query;
  const orderBy = order || "asc";
  await readData();
  const contacts = getContacts();

  let sortedContacts = contacts.slice(); // Create a copy to sort

  if (sort === "firstname") {
    sortedContacts.sort((a, b) => {
      return orderBy === "desc"
        ? b.firstName.localeCompare(a.firstName)
        : a.firstName.localeCompare(b.firstName);
    });
  } else if (sort === "createdAt") {
    sortedContacts.sort((a, b) => {
      const aDate = new Date(a.createdAt);
      const bDate = new Date(b.createdAt);
      return orderBy === "asc" ? aDate - bDate : bDate - aDate;
    });
  } else if (sort === "lastname") {
    sortedContacts.sort((a, b) => {
      const lastNameA = a.lastName ? a.lastName.toUpperCase() : "";
      const lastNameB = b.lastName ? b.lastName.toUpperCase() : "";
      return orderBy === "desc"
        ? lastNameB.localeCompare(lastNameA)
        : lastNameA.localeCompare(lastNameB);
    });
  }

  res.json(sortedContacts);
});

// Route to create a new contact
app.post("/createContact", async (req, res) => {
  try {
    const user = {
      id: uuidv4(),
      firstName: req.body.firstName || null,
      lastName: req.body.lastName || null,
      email: req.body.email || null,
      phone: req.body.phone || null,
      createdAt: new Date().toISOString(),
    };

    const { valid, invalidMessage } = await validateInput(user);

    if (valid) {
      const existingContacts = getContacts();
      existingContacts.push(user); // Add the new user to the existing contacts
      await writeData(existingContacts); // Write all contacts back to CSV
      res.json({ success: "Created new contact", data: user });
    } else {
      res.status(400).json({ error: invalidMessage });
    }
  } catch (err) {
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
});

// Route to remove all contacts
app.delete("/removeAllcontacts", async (req, res) => {
  try {
    await removeallContacts(); // Clear all contacts
    res.json({ success: "All contacts have been removed." });
  } catch (err) {
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
});

//Route to delete the contact by id
app.delete("/deleteContact/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const isDeleated = await deleteContactById(id); // Clear all contacts
    if (isDeleated) {
      res.json({ success: "Contact is Deleted" });
    } else {
      res.status(400).json({ error: "Error while deleting the contact" });
    }
  } catch (err) {
    res.status(500).json({ error: `Internal Server Error: ${err.message}` });
  }
});

// Route to get a contact by ID
app.get("/contact/:id", (req, res) => {
  const id = req.params.id;
  const contacts = getContacts();
  const contact = contacts.find((c) => c.id === id);

  if (contact) {
    res.json(contact);
  } else {
    res.status(404).json({ error: "Contact not found" });
  }
});

app.patch("/contacts/:id", async (req, res) => {
  const contactId = req.params.id;
  const updatedData = req.body;

  try {
    await readData();
    const contacts = getContacts();

    const contactIndex = contacts.findIndex(
      (contact) => contact.id === contactId
    );

    if (contactIndex === -1) {
      return res.status(404).json({ message: "Contact not found" });
    }

    contacts[contactIndex] = { ...contacts[contactIndex], ...updatedData };

    await writeData(contacts);

    res.json({
      message: "Contact updated successfully",
      contact: contacts[contactIndex],
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating contact", error });
  }
});

app.get("/contacts/search", async (req, res) => {
  const { q } = req.query;
  try {
    await readData();
    const contacts = getContacts();

    if (contacts.error) throw new Error(contacts.error);

    const search = q.toLowerCase();

    // Fuzzy search the contacts.
    const filteredContacts = contacts.filter((contact) => {
      const values = Object.values(contact);
      return values.some((value) => {
        if (typeof value === "string") {
          return value.toLowerCase().includes(search);
        }
      });
    });
    res.json(filteredContacts);
  } catch (error) {
    res.status(500).json({ message: "Error updating contact", error });
  }
});
// Example of a route to handle logs (implement as needed)
// app.get("/logs", (req, res) => {
//   // Logic to get and return logs
// });

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
