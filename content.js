function waitForText(text) {
    return new Promise((resolve) => {
        const find = () => [...document.querySelectorAll('span[role="text"]')]
            .find(el => el.textContent.trim() === text)

        const existing = find()

        if(existing) {
            resolve(existing)
            return
        }

        const observer = new MutationObserver(() => {
            const el = find()

            if(el) {
                observer.disconnect()
                resolve(el)
            }
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })
    })
}

let unsubscribeButtons

async function checkChannelPageReady() {
    await waitForText("All subscriptions");

    unsubscribeButtons = [
        ...document.querySelectorAll('button[aria-label^="Unsubscribe from "]')
    ];

    try {
        await browser.runtime.sendMessage({
            type: "channels-page-ready",
            nSubscribedChannels: unsubscribeButtons.length
        })
    } catch (error) {
        // No popup is listening.
    }
}

checkChannelPageReady()

async function unsubscribeAll() {
    for (const button of unsubscribeButtons) {
        button.click();
        await new Promise(resolve => setTimeout(resolve, 200));

        const confirmButton = document.querySelector('button[aria-label="Unsubscribe"]')
        confirmButton.click();

        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

browser.runtime.onMessage.addListener((message, sender) => {
    if(message.type === "check-channel-page-ready") {
        checkChannelPageReady()
    } else if(message.type === "unsubscribe-all") {
        unsubscribeAll()
    }
})