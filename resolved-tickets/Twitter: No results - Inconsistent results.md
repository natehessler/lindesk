#### Slack Conversation link:
https://sourcegraph.slack.com/archives/CTN0ZBETE/p1628520388058300

#### GitHub Issue link:
https://github.com/sourcegraph/customer/issues/455

#### GitHub Bug link:

#### Doc Update PR link:

#### Description of Customer Issue:
After upgrading from 3.29 to 3.30.3 the Twitter reported that searching for LoadBalancedHostFilter (for example) returns no results. There are no errors in the SG UI, just the alert with "No Results". After adding a repo filter, the expected results are returned.
The customer tried adding count:all and timeout:50s, but got no results either.
After testing other queries, they found inconsistent results for some queries, e.g. 7 results from 96 repos without repo filter and 500+ results with a repo filter.

#### Troubleshooting Steps:
After checking the repo IDs in the zoekt index files, we found that a lot of repos had an ID of 0. 
This issue stemmed from a previous issue, where Twitter disabled gitIndex when they were having trouble indexing their monorepo. Twitter was currently indexing with archiveIndex which doesn’t store repo IDs, causing all repos to have an ID of 0, and failing the ID based authorization to fail. 

#### Resolution:
After enabling gitIndex,the repos were reindexed successfully and results were displayed correctly on the front end.

#### Relevant Error / Logs:
zoekt-indexserver:
2021/08/09 13:26:02 updating index git.twitter.biz/gizzard-tools@HEAD=0315aa8203fdeae1452516d2936dd5b6105e09b3
2021/08/09 13:26:02 updated index git.twitter.biz/gizzard-tools@HEAD=0315aa8203fdeae1452516d2936dd5b6105e09b3 in 4.41454ms
2021/08/09 13:26:02 warn: immutable field changed, requires re-index: ID is immutable
The errors stated that the repo ID had changed, this would cause the authorization check to fail. Before results are streamed to the frontend the repo ID in Zoekt is cross-referenced with the repo ID in the database, if the repo IDs don’t match, results won’t be displayed.

#### Deployment Info:
- Deployment Type: Kubernetes
- Sourcegraph Version: 3.30.3
- Code Host: GitHub
- Unique Deployment features (extsvc config, external db, firewall, mutating webhooks, etc.): Custom gitserver image
- Engineering Team: search-core
