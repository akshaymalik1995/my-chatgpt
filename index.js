function closeSidebar() {
    const sidebar = document.querySelector("#sidebar")
    sidebar.style.display = "none"
}

function openSidebar() {
    const sidebar = document.querySelector("#sidebar")
    sidebar.style.display = "block"
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
    initiate() {
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

function generateRandomString(length = 14) {
    return Math.random().toString(16).substring(2, length)
}


function handleGptSettingsForm(e) {
    e.preventDefault()
    const form = e.target
    const systemPrompt = form['system-prompt'].value
    let maxTokens = form['max-tokens'].value
    let title = form['prompt-title'].value
    if (maxTokens) {
        maxTokens = parseInt(maxTokens)
    }

    state.activeGpt = {...state.activeGpt, systemPrompt, maxTokens, title }
    updateGptUI()
    updateGpts()
    updateSidebarUI()
    saveGptsToLocal()
    updateInfoUI("Settings successfully updated")

}




function handleKeyForm(e) {
    e.preventDefault()
    form = e.target
    const key = form['key'].value
    if (!key) {
        return
    }
    state.openaiKey = key
    saveKeyToLocal()
    updateInfoUI("Key is successfully added")
    form.reset()
}


function updateInfoUI(info) {
    const target = document.querySelector("#info")
    target.textContent = info
    target.style.display = "block"
    let timeout = setTimeout(() => {
        target.textContent = ""
        target.style.display = "none"
    }, 2000)

}



function disableForm(form, disabled) {
    const elements = form.elements
    for (let i = 0; i < elements.length; i++) {
        elements[i].disabled = disabled
    }
}

function updateAnswerUI(content) {
    const target = document.querySelector("#answer")
    target.innerText = content
}

async function handleQueryForm(e) {
    e.preventDefault()
    const form = e.target
    let userPrompt = form['user-prompt'].value
    let key = state.openaiKey
    if (!userPrompt) {
        updateInfoUI("The query cannot be empty")
        return
    }
    if (!key) {
        updateInfoUI("Key is missing")
        return
    }
    state.activeGpt.userPrompt = userPrompt

    let selectedModel = form['selected-model'].value
    try {
        console.log("Loading...")
        updateAnswerUI("Loading...")
        disableForm(form, disabled = true)
        const {maxTokens, systemPrompt} = state.activeGpt
        const url = "https://api.openai.com/v1/chat/completions"
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${key}`
        }

        const body = {
            model: selectedModel,
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

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        })
        let data = await response.json()
        if (!response.ok) {
            console.error(data)
            throw new Error(`Response returned with status code ${response.status}`)
        }

        const content = data.choices[0].message.content

        document.querySelector("#answer").innerText = content
    } catch (err) {
        console.log(err)
        document.querySelector("#answer").innerText = "Something went wrong!"
    } finally {
        disableForm(form, disabled = false)
    }
}


function addNewGpt() {
    const newGpt = {
        id: generateRandomString(),
        title: generateRandomString(),
        userPrompt: "",
        chatResponse: "",
        maxTokens: 1024,
        systemPrompt: "You shall be given a prompt. Respond as briefly as you can."
    }
    
    state.gpts = [...state.gpts , newGpt]
    updateSidebarUI()
    saveGptsToLocal()
}


const state = {
    gpts: [
        {
            id: "1",
            title: "GPT",
            userPrompt: "",
            chatResponse: "",
            maxTokens: 1024,
            systemPrompt: "You shall be given a prompt. Respond as briefly as you can.",
        }
    ],
    openaiKey : "",
    activeGpt: null,
    
}


function setActiveGpt(){
    state.activeGpt  = state.gpts[0]
} 

function getActiveGpt() {
    return state.gpts.find(gpt => gpt.id === state.activeGpt.id)
}

function updateGpts(){
    state.gpts = state.gpts.map(gpt => {
        if (gpt.id === state.activeGpt.id){
            return state.activeGpt
        } else {
            return gpt
        }
    })
}

function updateSidebarUI() {
    const target = document.querySelector("#side-tabs")
    target.innerHTML = ""
   state.gpts.forEach(gpt => {
        const tab = document.createElement("div")
        tab.classList.add("hover:bg-gray-700", "px-4", "py-4", "text-white", "cursor-pointer")
        tab.textContent = gpt.title
        tab.setAttribute("data-id", gpt.id)
        target.appendChild(tab)
    })
    saveGptsToLocal()
}

function updateGptUI() {
    const { title, maxTokens, userPrompt, chatResponse, systemPrompt } = state.activeGpt
    const gptSettingsForm = document.querySelector("#prompt-settings-form")
    document.querySelector("#answer").innerText = chatResponse
    document.querySelector("#user-prompt").value = userPrompt
    document.querySelector("#prompt-title").textContent = title || "GPT"
    gptSettingsForm['prompt-title'].value = title || ""
    gptSettingsForm['system-prompt'].value = systemPrompt || ""
    gptSettingsForm['max-tokens'].value = maxTokens || 1024
}



function changeGpt(e) {
    const tab = e.target
    const tabId = tab.dataset.id
    const gpt = state.gpts.find(gpt => gpt.id === tabId)
    console.log(gpt)
    state.activeGpt = gpt
    updateGptUI()
}

function deleteGpt(){
    if (state.gpts.length > 1){
        const gptid = state.activeGpt.id
        const gptToDelete = state.gpts.find(gpt => gpt.id === gptid)
        state.gpts = state.gpts.filter(gpt => gpt.id !== gptid)
        state.activeGpt = state.gpts[0]
        updateGptUI()
        updateSidebarUI()
        navigation.changeTab("home")
        updateInfoUI(`${gptToDelete.title} gpt successfully deleted`)
    } else {
        updateInfoUI("You need to have at least one gpt.")
    }
    
}

function getGptsFromLocal() {
    const gpts = localStorage.getItem("gpts")
    if (gpts) {
        state.gpts = JSON.parse(gpts)
    }
}

function getKeyFromLocal(){
    const key = localStorage.getItem("key")
    if (key) {
        state.openaiKey = key
    }
}

function saveKeyToLocal(){
    localStorage.setItem("key", state.openaiKey)
}

function saveGptsToLocal() {
    localStorage.setItem("gpts", JSON.stringify(state.gpts))
}

// Initialization
getKeyFromLocal()
getGptsFromLocal()
setActiveGpt()
updateSidebarUI()
updateGptUI()


// TO ADD A NEW GPT
const addGptBtn = document.querySelector("#add-prompt-btn")
addGptBtn.addEventListener("click", addNewGpt)

// Handling gpt settings form submission
const gptSettingsForm = document.querySelector("#prompt-settings-form")
gptSettingsForm.addEventListener("submit", handleGptSettingsForm)

// Handle Query Form
const queryForm = document.querySelector("#prompt-form")
queryForm.addEventListener("submit", handleQueryForm)

// Update Sidebar
const sideTabs = document.querySelector("#side-tabs")
sideTabs.addEventListener("click", e => {
    changeGpt(e)
    closeSidebar()
})


// Handle GPT Deletion
const deletePromptBtn = document.querySelector("#delete-prompt")
deletePromptBtn.addEventListener('click', deleteGpt)

// Handle Openai Key Submission
const keyForm = document.querySelector("#key-form")
keyForm.addEventListener("submit", handleKeyForm)

// Handle sidebar open and close
const closeSidebarBtn = document.querySelector("#close-sidebar-btn")
closeSidebarBtn.addEventListener("click", closeSidebar)
const openSidebarBtn = document.querySelector("#open-sidebar-btn")
openSidebarBtn.addEventListener("click", openSidebar)