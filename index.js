require("dotenv").config();
const axios = require("axios");

const method = process.env.METHOD || "get";
const protocol = process.env.PROTOCOL || "http";
const host = process.env.HOST;
const port = process.env.PORT;
const url = process.env.URL;

const BODY = process.env.BODY;
let data = BODY;
if (BODY) {
  try {
    const json = JSON.parse(BODY);
    data = json;
  } catch (e) {
    console.warn(
      "WARNING: Provided BODY content could not be parsed as JSON, will be sent as a string instead."
    );
  }
}

const headers = process.env.HEADERS
  ? JSON.parse(process.env.HEADERS)
  : undefined;

const request = {
  method,
  baseURL: port ? `${protocol}://${host}:${port}` : `${protocol}://${host}`,
  url,
  headers,
  data,
};

console.log(`PREPARED REQUEST:`, JSON.stringify(request));
console.log(`SENDING...`);

axios
  .request(request)
  .then((response) => {
    console.log(`REQUEST COMPLETED SUCCESSFULLY:`);
    console.log("  ", response.status, response.statusText);
    console.log("  ", "Headers:", JSON.stringify(response.headers));
    console.log("  ", "Body:", JSON.stringify(response.data));
  })
  .catch((error) => {
    if (error.response) {
      // Response received with a non 20x status.
      console.log(`REQUEST RETURNED ERROR:`);
      console.log("  ", error.response.status, error.response.statusText);
      console.log("  ", "Headers:", JSON.stringify(error.response.headers));
      console.log("  ", "Body:", JSON.stringify(error.response.data));
    } else {
      console.log(`ERROR SENDING REQUEST:`, error.message);
    }
  });
