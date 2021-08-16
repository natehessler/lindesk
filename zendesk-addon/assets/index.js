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
let ticketSummary = null

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

    //Edit this to select which fields get published from the Zendesk ticket api
    ticketSummary = {
        title: ticket.subject,
        description: ticket.description,
        requestor: ticket.requester.identities[0].value,
        cse: ticket.assignee.user.name,
        tags: ticket.tags,
        summary: ticket.comments[0].value,
    }
}

//given an object, print its key/val pairs to the screen
const printTicketSummary = (ticketDetails) => {
    const outTarget = document.getElementById("result")
    outTarget.innerHTML = ""

    for (let key in ticketDetails) {
        //ticket is html string to preserve html structure
        if (key == "summary") {
            const valueDisplay = document.createElement('p')
            valueDisplay.innerHTML = ticketDetails.summary
            outTarget.append(valueDisplay)
        } else {
            const keyDisplay = document.createElement('span')
            keyDisplay.appendChild(document.createTextNode(key.charAt(0).toUpperCase() + key.slice(1) + ": "))
            const valueDisplay = document.createElement('span')
            keyDisplay.style.fontWeight = "900"
            valueDisplay.appendChild(document.createTextNode(ticketDetails[key]))
            const fieldDisplay = document.createElement('p')
            fieldDisplay.appendChild(keyDisplay)
            fieldDisplay.appendChild(valueDisplay)
            outTarget.append(fieldDisplay)
        }
    }

    if (outTarget.innerHTML != "") {
        outTarget.classList.add("preview-window")
    } else {
        outTarget.classList.remove("preview-window")
    }


}

// copies content to clipboard
const copyToClipBoard = async(content) => {
    try {
        await navigator.clipboard.writeText(document.getElementById('result').outerHTML)
        console.log("wrote to clipboard")
        document.getElementById('messages').innerHTML = "Copied to Clipboard"
    } catch (err) {
        console.log('Something went wrong', err);
    }
}