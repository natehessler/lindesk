const fs = require("fs");
const { resolve } = require("path");

let ticket = "";

fs.readFile("./resolved-tickets/2935.md", "utf8", async (err, data) => {
  if (err) throw new Error(err);
  ticket = data;
  console.log(ticket);
});

fs.mkdir("./converted", { recursive: true }, (err) => {
  if (err) return err;
});

console.log(ticket);

// fs.writeFile("./converted/2935.txt", ticket, (err) => {
//   if (err) return err;
// });
