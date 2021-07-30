// Written by Christy for a customer who asked for a list of users that accessed certain repostories and the action they performed:
// https://sourcegraph.slack.com/archives/C022SPMNR0W/p1627599444032000
// a sample JavaScript program that calls into the API and pulls out the list of emails of any user who has had ANY interaction with one of the PCI repos.
// To set-up and run the program please do the following (will require NodeJS):
// 1. Create a new folder.
// 2. In that folder run: `npm init`
// 3. Accept all default values
// 4. Then run: `npm i node-fetch`
// 5. Then create a new file (called `audit.js`) and paste the contents of the script in it
// 6. Replace the values required on line 46 (the MeLi sourcegraph URL, and an Sourcegraph access token for the GraphQL API, which can be generated at: https://sourcegraph.example.com/user/settings/tokens, and also the list of the name of PCI repos to check for)
// 7. Run node ./audit.js
                                        
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fetch_1 = __importDefault(require("node-fetch"));
const FETCH_ALL_EVENTS = `
query {
  users(activePeriod: ALL_TIME) {
    nodes {
      emails  {
        email
      }
      username
      eventLogs {
        nodes{
          name
         url
        }
      }
    }
  }
}`;
async function make_request(sg_host, sg_token, query) {
    return await node_fetch_1.default(`${sg_host}/.api/graphql`, {
        method: 'post',
        headers: {
            Authorization: `token ${sg_token}`
        },
        body: JSON.stringify({
            query
        })
    });
}
async function find_users_who_accessed_pci(sg_host, sg_token, pci_repos) {
    const events = await fetch_all_events(sg_host, sg_token);
    const users = events.data.users.nodes.filter(u => u.eventLogs.nodes.find(e => pci_repos.find(repo => e.url.toLowerCase().indexOf(repo.toLowerCase()) != -1)));
    return users ? users.map(u => u.emails.map(e => e.email)) : [];
}
async function fetch_all_events(sg_host, sg_token) {
    const r = await make_request(sg_host, sg_token, FETCH_ALL_EVENTS);
    return await r.json();
}


find_users_who_accessed_pci('https://<MELI-SOURCEGRAPH-DOMAIN>', '<API KEY>', ['<PCI-REPO-A>', '<PCI-REPO-B>']).then(r => {
    console.log(JSON.stringify(r));
});
