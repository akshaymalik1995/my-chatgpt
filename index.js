const promptForm = document.querySelector("#prompt-form")
const keyForm = document.querySelector("#key-form")
const promptSettingsForm = document.querySelector("#prompt-settings-form")
let promptSettings = {
    systemPrompt : "You shall be given a prompt. Respond as briefly as you can",
    maxTokens : 1024
}
function handlePromptSettingsForm(e){
    e.preventDefault()
    const form = e.target
    const systemPrompt = form['system-prompt'].value
    let maxTokens = form['max-tokens'].value
    if (maxTokens){
        maxTokens = parseInt(maxTokens)
    }
    promptSettings = {
        systemPrompt,
        maxTokens,

    }
    localStorage.setItem("prompt-settings", JSON.stringify(promptSettings))
    addInfo("Settings updated")

}

promptSettingsForm.addEventListener("submit", handlePromptSettingsForm)

function insertPromptSettings(){
    const localSettings = localStorage.getItem("prompt-settings")
    if (localSettings){
        let parsedSettings = JSON.parse(localSettings)
        promptSettings = parsedSettings
    }
    promptSettingsForm['system-prompt'].value = promptSettings.systemPrompt
    promptSettingsForm['max-tokens'].value = promptSettings.maxTokens
}

insertPromptSettings()



function handleKeyForm(e) {
    e.preventDefault()
    form = e.target
    const key = form['key'].value
    if (!key) {
        return
    }
    localStorage.setItem('key', key)
    addInfo("Key is added")
    form.reset()
}


function addInfo(info) {
    const target = document.querySelector("#info")
    target.textContent = info
    target.style.display = "block"
    let timeout = setTimeout(() => {
        target.textContent = ""
        target.style.display = "none"
    }, 2000)

}

keyForm.addEventListener("submit", handleKeyForm)

function disableForm(form, disabled) {
    const elements = form.elements
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = disabled
    }
}

function injectResponse(content) {
    const target = document.querySelector("#answer")
    target.innerText = content
}

async function handlePromptForm(e) {
    e.preventDefault()
    const form = e.target
    let userPrompt = form['user-prompt'].value
    let key = localStorage.getItem("key")
    if (!userPrompt) {
        addInfo("The query cannot be empty")
        return
    }
    if (!key) {
        addInfo("Key is missing")
        return
    }


    let selectedModel = form['selected-model'].value
    try {
        console.log("Loading...")
        injectResponse("Loading...")
        disableForm(form, disabled = true)
        const data = await talkToGPT(
            systemPrompt = promptSettings.systemPrompt,
            userPrompt = userPrompt,
            openai_key = key,
            model = selectedModel,
            maxTokens = promptSettings.maxTokens
        )

        const content = data.choices[0].message.content
        injectResponse(content)
        console.log(content)

    } catch (err) {
        console.log(err)
        injectResponse("Something went wrong! Try again.")
    } finally {
        disableForm(form, disabled = false)
    }
}

promptForm.addEventListener("submit", handlePromptForm)

async function talkToGPT(systemPrompt, userPrompt, openai_key, model = "gpt-3.5-turbo", maxTokens = 1024) {
    if (!systemPrompt || !userPrompt || !openai_key) {
        throw new Error("System prompt or user prompt or openai key is missing.")
    }

    const url = "https://api.openai.com/v1/chat/completions"
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openai_key}`
    }

    const body = {
        model: model,
        max_tokens: maxTokens,
        messages: [
            {
                "role": "system",
                "content": systemPrompt,
            },
            {
                "role": "user",
                "content": userPrompt,
            },
        ]
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        })
        let data = await response.json()
        if (!response.ok) {
            console.error(data)
            throw new Error(`Response returned with status code ${response.statusText}`)
        }
        return data

    } catch (err) {
        console.error(err)
    }
}



const navigation = {
    active: "home",
    setCurrentTab() {
        document.querySelector(`#${this.active}`).style.display = 'block'
    },
    hideCurrentTab() {
        document.querySelector(`#${this.active}`).style.display = 'none'
    },
    changeTab(tab) {
        this.hideCurrentTab()
        this.active = tab
        this.setCurrentTab()
    },
    initiate(){
        const tabs = document.querySelectorAll("nav > div")
        tabs.forEach(tab => {
            const tabId = tab.dataset.target
            tab.addEventListener("click", e => {
                console.log(e)
                navigation.changeTab(tabId)
            })
        })
        this.setCurrentTab()
    }
}

navigation.initiate()
