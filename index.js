require("dotenv").config();
const { omit } = require("lodash");
const axios = require("axios");

/**
 * Read in env variables
 */
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

const headers = process.env.HEADERS ? JSON.parse(process.env.HEADERS) : {};

// OPTIONAL: Ego Auth Variables, used to add ego auth to the request.
const egoUrl = process.env.EGO_URL;
const egoClient = process.env.EGO_CLIENT_ID;
const egoSecret = process.env.EGO_CLIENT_SECRET;

/**
 * Main Function - All work done here
 */
async function runScript() {
  if (egoUrl && egoClient && egoSecret) {
    await fetchEgoCredentials();
  }

  const request = {
    method,
    baseURL: port ? `${protocol}://${host}:${port}` : `${protocol}://${host}`,
    url,
    headers,
    data,
  };

  console.log(
    `PREPARED REQUEST:`,
    JSON.stringify(omit(request, "headers.Authorization"))
  );
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
}

function consoleSectionBreak() {
  console.log(`\n\n=========================`);
}

async function fetchEgoCredentials() {
  consoleSectionBreak();
  console.log(`FETCHING EGO AUTH AT: ${egoUrl}`);
  const egoAuthUrl = `${egoUrl}/oauth/token?client_id=${egoClient}&client_secret=${egoSecret}&grant_type=client_credentials`;
  // https://ego.dev.argo.cancercollaboratory.org/api/oauth/token?grant_type=client_credentials&client_id=daco-cron-runner&client_secret=secret

  try {
    const response = await axios.post(egoAuthUrl);
    const egoAuth = response.data.access_token;

    console.log(`EGO CREDENTIALS RETRIEVED, ADDING TO REQUEST`);
    headers.Authorization = `Bearer ${egoAuth}`;
    consoleSectionBreak();
  } catch (err) {
    console.log(`ERROR WHILE RETRIEVING EGO CREDENTIALS - ${err.message}`);
    console.log(`ENDING PROCESS DUE TO EGO FAILURE`);
    process.exit();
  }
}

/**
 * RUN SCRIPT
 */
runScript();
