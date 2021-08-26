Slack Link: https://sourcegraph.slack.com/archives/C0183JV3Q0Y/p1628476380004500

Customer Issue:
The Customer's instance doesn't return all matches of -alpha- in lockfiles(yarn.lock). A particular lock file wasn't showing up in the search query.
 
Troubleshooting Steps:
I did a repro of the issue on our end searched for -alpha-, passed the file flag as file:yarn.lock  and got a number of results as expected. Asked the customer to pass the count: flag to see if there might be some changes in the result count. Basically, run the same query and add count:all. Still Didnt show up.
 
came across a GitHub issue, that talked about something a bit similar. Decided to ask the customer what the size of this particular yarn.lock file.
He responded that the file is Large, 30k lines.
Asked the Customer to make the following modification to your search.largeFiles configuration:

```"search.largeFiles": [
 "*.lock",
 "*/*.lock",
 "**/*.lock"
 "*/*/*.lock",
 "*/*/*/*.lock",
 "*/*/*/*/*.lock",
 "*/*/*/*/*/*.lock",
 "*/*/*/*/*/*/*.lock",
 "*/*/*/*/*/*/*/*.lock",
 "*/*/*/*/*/*/*/*/*.lock"
 ],```

Changing search.largeFiles should trigger a reindex of all repositories then attempt the search query again.
 
Resolution:
Making the above modifications to the search.largeFiles fixed the issue.
I also made sure the customer confirmed the repo was re-indexed after making the changes.
Customer confirmed that it now works as expected.
