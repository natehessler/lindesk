//Initiates a zendesk api client
var client = ZAFClient.init();

//load icons
feather.replace()

//sets height of the plugin iframe
client.invoke('resize', {
    width: '100%',
    height: '400px'
});

//global state for ticket summary
let ticketSummary = ""

//adds click functionality to the fetch button
document.getElementById('fetch-button').addEventListener('click', async() => {
    await fetchTicketSummary()
    if (ticketSummary) {
        printTicketSummary(ticketSummary)
        document.getElementById('copy-button').classList.remove('disabled')
    } else {
        document.getElementById('copy-button').classList.add('disabled')
    }
})

// adds click to copy to clipboard
document.getElementById('copy-button').addEventListener('click', async() => {
    if (ticketSummary) {
        await copyToClipBoard(ticketSummary)
    }
})

//grabs ticket info from the Zendesk api
const fetchTicketSummary = async() => {
    const res = await client.get('ticket')
    const ticket = res.ticket
    console.log(ticket)

    //Edit this to select which fields get published from the Zendesk ticket api
    ticketSummary = {
        Title: ticket.subject,
        Description: ticket.description,
        Requestor: ticket.requester.identities[0].value,
        CSE: ticket.assignee.user.name,
        Tags: ticket.tags,
        Summary: parseSummary(ticket.comments[0].value),
    }
}

//given an object, print its key/val pairs to the screen
const printTicketSummary = (ticketDetails) => {
    const outTarget = document.getElementById("result")
    outTarget.innerHTML = ""

    for (let key in ticketDetails) {
        const keyDisplay = document.createElement('span')
        keyDisplay.appendChild(document.createTextNode(key + ": "))
        const valueDisplay = document.createElement('span')
        keyDisplay.style.fontWeight = "900"
        valueDisplay.appendChild(document.createTextNode(ticketDetails[key]))
        const fieldDisplay = document.createElement('p')
        fieldDisplay.appendChild(keyDisplay)
        fieldDisplay.appendChild(valueDisplay)
        outTarget.append(fieldDisplay)
    }

    if (outTarget.innerHTML != "") {
        outTarget.classList.add("preview-window")
    } else {
        outTarget.classList.remove("preview-window")
    }


}

//parses response out of HTML entry from Zendesk
const parseSummary = (str) => {
    let index = 1
    let count = 1

    //assuming first char is always <
    while (index < str.length && count > 0) {
        if (str.charAt(index) === "<") {
            count++
        }
        if (str.charAt(index) === ">") {
            count--
        }
        index++
    }
    let out = ""
    while (str.charAt(index) != "<") {
        out += str.charAt(index)
        index++
    }
    return out
}

const prettyParseObj = (obj) => {
    let out = ""
    for (let key in obj) {
        out += `${key}: ${obj[key]} \n`
    }
    return out
}

// copies content to clipboard
const copyToClipBoard = async(content) => {
    try {
        await navigator.clipboard.writeText(prettyParseObj(content))
        console.log("wrote to clipboard")
        document.getElementById('messages').innerHTML = "Copied to Clipboard"
    } catch (err) {
        console.log('Something went wrong', err);
    }
}