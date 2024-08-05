const fs = require("fs");
const csv = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
require("../");
// Global variable to store CSV data
let globalData = [];

// Function to read data from a CSV file and store it in globalResults
function readData() {
  return new Promise((resolve, reject) => {
    globalData = []; // Clear previous data

    fs.createReadStream("../Day2-express/contacts.csv")
      .pipe(csv())
      .on("data", (row) => {
        if (Object.keys(row).length > 0 && row.firstName) {
          globalData.push(row);
        }
      })
      .on("end", () => {
        //console.log("CSV file was read successfully");
        resolve();
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

// Function to write data to a CSV file
function writeData(data) {
  const csvWriter = createCsvWriter({
    path: "../Day2-express/contacts.csv",
    header: [
      { id: "id", title: "id" },
      { id: "firstName", title: "firstName" },
      { id: "lastName", title: "lastName" },
      { id: "email", title: "email" },
      { id: "phone", title: "phone" },
      { id: "createdAt", title: "createdAt" },
    ],
  });

  globalData.push(data);

  return csvWriter.writeRecords(data);
}

function removeallContacts() {
  return writeData([]);
}

async function deleteContactById(id) {
  await readData();

  // Filter out the contact with the specified ID
  const updatedData = globalData.filter((contact) => contact.id !== id);

  // Write the updated data back to the CSV file
  await writeData(updatedData);

  return updatedData.length !== globalData.length; // Return true if a contact was deleted
}

// Function to get the globalResults
function getContacts() {
  return globalData.filter((contact) => Object.keys(contact).length > 0);
}

module.exports = {
  readData,
  writeData,
  getContacts,
  removeallContacts,
  deleteContactById,
};
