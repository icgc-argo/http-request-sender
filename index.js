/*
 * Copyright (c) 2022 The Ontario Institute for Cancer Research. All rights reserved
 *
 * This program and the accompanying materials are made available under the terms of
 * the GNU Affero General Public License v3.0. You should have received a copy of the
 * GNU Affero General Public License along with this program.
 *  If not, see <http://www.gnu.org/licenses/>.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
 * SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
 * INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
 * TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
 * IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
 * ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

require('dotenv').config();

const axios = require('axios');
const { omit } = require('lodash');
const process = require('node:process');

const vault = require('./vault');

/**
 * Read in env variables
 */
const method = process.env.METHOD || 'get';
const protocol = process.env.PROTOCOL || 'http';
const host = process.env.HOST;
const port = process.env.PORT;
const url = process.env.URL;

const headers = process.env.HEADERS ? JSON.parse(process.env.HEADERS) : {};

const BODY = process.env.BODY;
let data = BODY;

if (BODY) {
  try {
    const json = JSON.parse(BODY);
    data = json;
  } catch (e) {
    console.warn(
      'WARNING: Provided BODY content could not be parsed as JSON, will be sent as a string instead.'
    );
  }
}

/**
 * Function definitions
 */
function consoleSectionBreak() {
  console.log(`\n\n=========================`);
}

async function loadVaultSecrets() {
  const vaultEnabled = process.env.VAULT_ENABLED === 'true';
  let secrets = {};

  /** Vault */
  if (vaultEnabled) {
    if (process.env.VAULT_ENABLED && process.env.VAULT_ENABLED === 'true') {
      if (!process.env.VAULT_SECRETS_PATH) {
        console.error('Path to secrets not specified but vault is enabled');
        throw new Error('Path to secrets not specified but vault is enabled');
      }

      try {
        secrets = await vault.loadSecret(process.env.VAULT_SECRETS_PATH);
      } catch (err) {
        console.error('Failed to load secrets from vault.');
        throw new Error('Failed to load secrets from vault.');
      }
    }
  }

  return secrets;
}

async function fetchEgoCredentials(egoUrl, egoClient, egoSecret) {
  consoleSectionBreak();

  console.log(`Fetching EGO authentication details at "${egoUrl}"`);
  const egoAuthUrl = `${egoUrl}/oauth/token?client_id=${egoClient}&client_secret=${egoSecret}&grant_type=client_credentials`;
  // https://ego.dev.argo.cancercollaboratory.org/api/oauth/token?grant_type=client_credentials&client_id=daco-cron-runner&client_secret=secret

  try {
    const response = await axios.post(egoAuthUrl);
    const egoAuth = response.data.access_token;

    console.log(`EGO credentials retrieved successfully`);
    headers.Authorization = `Bearer ${egoAuth}`;

    consoleSectionBreak();
  } catch (err) {
    console.error(`Failed to retrieve EGO credentials - ${err.message}`);
    throw new Error('Failed to retrieve EGO credentials');
  }
}

/**
 * Main Function - All work done here
 */
async function runScript() {
  const vaultSecrets = await loadVaultSecrets();

  // OPTIONAL: Ego Auth Variables, used to add ego auth to the request.
  const egoUrl = vaultSecrets.EGO_URL || process.env.EGO_URL;
  const egoClient = vaultSecrets.EGO_CLIENT_ID || process.env.EGO_CLIENT_ID;
  const egoSecret = vaultSecrets.EGO_CLIENT_SECRET || process.env.EGO_CLIENT_SECRET;

  if (egoUrl && egoClient && egoSecret) {
    try {
      await fetchEgoCredentials(egoUrl, egoClient, egoSecret);
    } catch (err) {
      console.error('An error was found and the process will stop before making a request.');
      process.exit(1);
    }
  }

  const request = {
    method,
    baseURL: port ? `${protocol}://${host}:${port}` : `${protocol}://${host}`,
    url,
    headers,
    data,
  };

  console.log(`PREPARED REQUEST:`, JSON.stringify(omit(request, 'headers.Authorization')));
  console.log(`SENDING...`);

  axios
    .request(request)
    .then((response) => {
      console.log(`REQUEST COMPLETED SUCCESSFULLY:`);
      console.log('  ', response.status, response.statusText);
      console.log('  ', 'Headers:', JSON.stringify(response.headers));
      console.log('  ', 'Body:', JSON.stringify(response.data));
    })
    .catch((error) => {
      if (error.response) {
        // Response received with a non 20x status.
        console.log(`REQUEST RETURNED ERROR:`);
        console.log('  ', error.response.status, error.response.statusText);
        console.log('  ', 'Headers:', JSON.stringify(error.response.headers));
        console.log('  ', 'Body:', JSON.stringify(error.response.data));
      } else {
        console.log(`ERROR SENDING REQUEST:`, error.message);

        process.exitCode = 1;
      }
    });
}

/**
 * RUN SCRIPT
 */
runScript();
