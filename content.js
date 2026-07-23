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

let subscribedButtons

(async () => {
    await waitForText("All subscriptions");

    subscribedButtons = [
        ...document.querySelectorAll('button[aria-label]')
    ].filter(button =>
        button.querySelector('span[role="text"]')?.textContent.trim() === "Subscribed"
    );

    console.log(subscribedButtons)

    browser.runtime.sendMessage({
        type: "channels-page-ready",
        nSubscribedChannels: subscribedButtons.length
    })
})();