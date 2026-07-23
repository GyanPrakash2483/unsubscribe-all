const other_page_div = document.getElementById("on-other-page")
const channels_page_div = document.getElementById("on-channels-page")

document.addEventListener("DOMContentLoaded", async () => {
    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true
    })

    const url = new URL(tab.url)

    if(
        url.origin === "https://www.youtube.com" &&
        url.pathname === "/feed/channels"
    ) {
        other_page_div.style.display = "none"
        channels_page_div.style.display = "block"
    } else {
        channels_page_div.style.display = "none"
        other_page_div.style.display = "block"
    }

    // The content script may not be available yet (for example immediately
    // after a navigation or after the extension has been reloaded). Do not
    // leave an unhandled promise rejection in that case.
    try {
        await browser.tabs.sendMessage(tab.id, {
            type: "check-channel-page-ready"
        })
    } catch (error) {
        if (url.origin === "https://www.youtube.com" &&
            url.pathname === "/feed/channels") {
            channels_page_div.querySelector("p").textContent =
                "YouTube is still loading. Reopen this popup when ready."
        }
    }
})

const go_channels_page = document.getElementById("go-channels-page")

go_channels_page.addEventListener("click", async () => {
    const tab = await browser.tabs.update({
        url: "https://www.youtube.com/feed/channels"
    })
})

let nSubscribedChannels = 0;

function updateChannelsSection() {
    channels_page_div.innerHTML = `
        <p>${nSubscribedChannels} Channels subscribed</p>
        <button id="unsubscribe-all">Unsubscribe all</button>
    `
}

browser.runtime.onMessage.addListener((message, sender) => {
    if(message.type === "channels-page-ready") {
        other_page_div.style.display = "none";
        channels_page_div.style.display = "block";

        nSubscribedChannels = message.nSubscribedChannels
        updateChannelsSection()
    }
})

channels_page_div.addEventListener("click", async (event) => {
    if (event.target.id !== "unsubscribe-all") return

    const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true
    })

    try {
        await browser.tabs.sendMessage(tab.id, {
            type: "unsubscribe-all"
        })
    } catch (error) {
        channels_page_div.querySelector("p").textContent =
            "The YouTube page is not ready. Reopen this popup and try again."
    }
})