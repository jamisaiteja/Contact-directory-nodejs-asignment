const { readData, getContacts } = require("./csvoperations");
const binarySearch = require("./binarySearch");

const validateInput = async (data) => {
  let valid = true;
  let invalidMessage = "";

  for (let [key, value] of Object.entries(data)) {
    // first name validation
    if (key === "firstName") {
      if (value === null || value === undefined) {
        valid = false;
        invalidMessage = "First name is a mandatory field";
        break;
      }

      if (typeof value !== "string") {
        valid = false;
        invalidMessage = "First name must be a string";
        break;
      }
    }

    // last name validation
    if (key === "lastName") {
      if (value !== null && typeof value !== "string") {
        valid = false;
        invalidMessage = "Last name must be a string";
        break;
      }
    }

    // email validation
    if (key === "email") {
      if (value !== null && typeof value !== "string") {
        valid = false;
        invalidMessage = "Email must be a string";
        break;
      }
    }

    // phone number validation
    if (key === "phone") {
      if (value === null || value === undefined) {
        valid = false;
        invalidMessage = "Phone number is a mandatory field";
        break;
      }

      if (typeof value !== "number") {
        valid = false;
        invalidMessage = "Phone number must be a number";
        break;
      }

      if (value <= 1000000000 || value >= 10000000000) {
        valid = false;
        invalidMessage = "Phone number must be 10 digits long";
        break;
      }
    }

    if (valid) {
      await readData();
      const contacts = getContacts();
      const numberInDB = binarySearch(contacts, data.phone);

      if (numberInDB.isFound) {
        valid = false;
        invalidMessage = "Phone number already in DB";
      }
    }
  }

  return { valid, invalidMessage };
};

module.exports = validateInput;
