// Selectors rely on page structure, not text, so they work in every YouTube language.
// Each row also has a notification button inside the subscribe renderer.
const SUBSCRIBED_BUTTON = 'ytd-channel-renderer ytd-subscribe-button-renderer[subscribed] button:not(#notification-preference-button *)'
const CONFIRM_BUTTON = 'yt-confirm-dialog-renderer #confirm-button button'

const PAGE_READY_TIMEOUT = 10000
const DIALOG_TIMEOUT = 5000

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Polls rather than observing, because YouTube can show and hide an existing
// dialog without adding any nodes.
async function waitFor(check, timeout) {
    const deadline = Date.now() + timeout

    while(Date.now() < deadline) {
        const result = check()

        if(result) {
            return result
        }

        await delay(100)
    }

    return null
}

function findVisibleConfirmButton() {
    return [...document.querySelectorAll(CONFIRM_BUTTON)]
        .find(el => el.getClientRects().length > 0)
}

let unsubscribeButtons = []

async function checkChannelPageReady() {
    if(location.pathname !== "/feed/channels") {
        return
    }

    // Times out so an account with no subscriptions still reports 0.
    await waitFor(() => document.querySelector(SUBSCRIBED_BUTTON), PAGE_READY_TIMEOUT)

    unsubscribeButtons = [
        ...document.querySelectorAll(SUBSCRIBED_BUTTON)
    ];

    notifyPopup({
        type: "channels-page-ready",
        nSubscribedChannels: unsubscribeButtons.length
    })
}

async function notifyPopup(message) {
    try {
        await browser.runtime.sendMessage(message)
    } catch (error) {
        // No popup is listening.
    }
}

checkChannelPageReady()

async function unsubscribeAll() {
    // Reopening the popup mid-run replaces unsubscribeButtons, so keep this run's list.
    const buttons = unsubscribeButtons

    for (const [index, button] of buttons.entries()) {
        button.scrollIntoView({
            block: "center",
            behaviour: "smooth"
        })
        button.click();

        const confirmButton = await waitFor(findVisibleConfirmButton, DIALOG_TIMEOUT)

        // Something is wrong with the page, so stop instead of clicking on blindly.
        if(!confirmButton) {
            return
        }

        confirmButton.click();

        notifyPopup({
            type: "unsubscribe-progress",
            nSubscribedChannels: buttons.length - index - 1
        })

        // Otherwise the next channel could match this dialog while it is closing.
        await waitFor(() => !findVisibleConfirmButton(), DIALOG_TIMEOUT)
        await delay(500)
    }
}

browser.runtime.onMessage.addListener((message, sender) => {
    if(message.type === "check-channel-page-ready") {
        checkChannelPageReady()
    } else if(message.type === "unsubscribe-all") {
        unsubscribeAll()
    }
})