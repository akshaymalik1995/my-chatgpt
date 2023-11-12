const promptForm = document.querySelector("#prompt-form")
const keyForm = document.querySelector("#key-form")
const promptSettingsForm = document.querySelector("#prompt-settings-form")
const closeSidebarBtn = document.querySelector("#close-sidebar-btn")
closeSidebarBtn.addEventListener("click", closeSidebar)
function closeSidebar(){
    const sidebar = document.querySelector("#sidebar")
    sidebar.style.display = "none"
}
const openSidebarBtn = document.querySelector("#open-sidebar-btn")
openSidebarBtn.addEventListener("click", openSidebar)
function openSidebar(){
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

function generateRandomString(length= 14){
    return Math.random().toString(16).substring(2, length)
}

const addPromptBtn = document.querySelector("#add-prompt-btn")
addPromptBtn.addEventListener("click", (e) => {
    
    e.stopPropagation()
    console.log(gpts)
    gpts.push(
        {
            id : generateRandomString(),
            title : generateRandomString(),
            userPrompt : "",
            chatResponse : "",
            settings : {
                maxTokens : 1024,
                systemPrompt : "You shall be given a prompt. Respond as briefly as you can."

            }
        }
    )
    localStorage.setItem("gpts", JSON.stringify(gpts))
    updateSideTabs()
})

const sideTabs = document.querySelector("#side-tabs")
sideTabs.addEventListener("click", e => {
    const tab = e.target
    const tabId = tab.dataset.id
    const gpt = gpts.find(gpt => gpt.id === tabId)
    activePrompt = gpt
    updatePromptSettings()
    navigation.changeTab('home')
    document.querySelector("#prompt-title").textContent = gpt.title
    closeSidebar()
})



let gpts = [
    {
        id : "1",
        title : "GPT",
        settings : {
            systemPrompt : "You will be given a prompt. Respond as briefly as you can.",
            maxTokens : 1024
        }
    },
]

if (localStorage.getItem("gpts")){
    gpts = JSON.parse(localStorage.getItem("gpts"))
}

const deletePromptBtn = document.querySelector("#delete-prompt")
deletePromptBtn.addEventListener('click', () => {
   
    if (gpts.length > 1){
        gpts = gpts.filter(gpt => gpt.id !== activePrompt.id)
        activePrompt = gpts[0]
        updatePromptSettings()
        updateSideTabs()
        localStorage.setItem("gpts", JSON.stringify(gpts))
        navigation.changeTab("home")
        
    } else {
        addInfo("You cannot delete all prompts")
    }
})


function updateSideTabs(){
    const target = document.querySelector("#side-tabs")
    target.innerHTML = ""
    gpts.forEach(gpt => {
        const tab = document.createElement("div")
        tab.classList.add("hover:bg-gray-700", "px-4", "py-4", "text-white", "cursor-pointer")
        tab.textContent = gpt.title
        tab.setAttribute("data-id", gpt.id)
        target.appendChild(tab)
    })
}
updateSideTabs()


let activePrompt = gpts[0]
function handlePromptSettingsForm(e){
    e.preventDefault()
    const form = e.target
    const systemPrompt = form['system-prompt'].value
    let maxTokens = form['max-tokens'].value
    let promptTitle = form['prompt-title'].value
    if (maxTokens){
        maxTokens = parseInt(maxTokens)
    }
    activePrompt.settings = {
        systemPrompt,
        maxTokens,
    }

    activePrompt.title = promptTitle
    updatePromptSettings()
    gpts = gpts.map(gpt => {
        if (gpt.id === activePrompt.id){
            gpt = activePrompt
           
        }
        return gpt
    })
    localStorage.setItem("gpts", JSON.stringify(gpts))
    updateSideTabs()
    addInfo("Settings updated")

}

promptSettingsForm.addEventListener("submit", handlePromptSettingsForm)

function updatePromptSettings(){
    injectResponse("You will see the response here")

    document.querySelector("#user-prompt").value = ""
   

    const settings = activePrompt?.settings
    promptSettingsForm['system-prompt'].value = settings?.systemPrompt || ""
    document.querySelector("#prompt-title").textContent = activePrompt?.title || ""
    promptSettingsForm['max-tokens'].value = settings?.maxTokens || "" 
    promptSettingsForm['prompt-title'].value = activePrompt?.title || ""
}

updatePromptSettings()



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
        const settings = activePrompt.settings
        const data = await talkToGPT(
            systemPrompt = settings.systemPrompt,
            userPrompt = userPrompt,
            openai_key = key,
            model = selectedModel,
            maxTokens = settings.maxTokens
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




