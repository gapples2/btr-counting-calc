let realData = {}
let data = new Proxy({
    exists(prop) {
        return realData[prop] !== undefined
    }
}, {
    get(target, property) {
        return realData[property] ?? placeholders[property] ?? target[property]
    },
    set(_, property, value) {
        realData[property] = value
    }
})

let placeholders = {}

function setPlaceholder(id, val, ele = elements[id]) {
    placeholders[id] = val
    ele.placeholder = val
}

function parseNumeric(input, doUpdate=true, options={}) {
    let dataId = options.id ?? input.id
    let value = options.value ?? input.value
    let min = options.min ?? 0
    let max = options.max ?? Infinity
    let num = Number(value.replaceAll(",",""))
    if(num >= min && num <= max && !Number.isNaN(num) && !value.endsWith(".")) {
        data[dataId] = num
        input.style.borderColor = "white"
        if(doUpdate)update()
    }else{
        input.style.borderColor = "red"
    }
}

function parseLetter(input, doUpdate=true, options={}) {
    let dataId = options.id ?? input.id
    let value = options.value ?? input.value
    if(/^[A-Z]+$/.test(value)) {
        data[dataId] = calcThread.parseLetterNotation(value)
        input.style.borderColor = "white"
        if(doUpdate)update()
    }else{
        input.style.borderColor = "red"
    }
}

function generateUpgGrid() {
    let colorIndex = [[1,1,2,1,1],[1,0,0,0,1],[2,0,3,0,2],[1,0,0,0,1],[1,1,2,1,1]]
    let colors = ["white", "red", "purple", "lime"]

    let numberRow = document.createElement("div")
    for(let y=0;y<5;y++){
        let span = document.createElement("span")
        span.style.display = "inline-block"
        span.style.width = "20px"
        span.style.height = "20px"
        span.style.textAlign = "center"
        span.style.paddingLeft = y == 0 ? "23px" : "12.5px"
        span.textContent = ` ${y + 1}`

        numberRow.appendChild(span)
    }
    elements["upg-grid"].appendChild(numberRow)

    for(let y=0;y<5;y++){
        let rowDiv = document.createElement("div")
        rowDiv.className = "row"
        rowDiv.innerHTML = `<span style="width:20px;height:20px;text-align:center;margin-right:4px">${y + 1}0</span>`

        for(let x=0;x<5;x++){
            let id = `upg-has${x+1}${y+1}`
            let div = document.createElement("div")
            div.className = "row"
            div.style.width = "20px"
            div.style.height = "20px"
            div.style.margin = "4px"
            div.style.border = "3px solid " + colors[colorIndex[y][x]]
            
            let input = document.createElement("input")
            input.id = id
            input.type = "checkbox"
            input.style.margin = "0px"

            div.appendChild(input)
            rowDiv.appendChild(div)
        }

        elements["upg-grid"].appendChild(rowDiv)
    }
}

const customInputs = {
    "count-help-isletter": ["change", false, (input) => {
        let chc = elements["count-help-current"]
        data[input.id] = input.checked
        if(input.checked) {
            chc.value = calcThread.convertLetterNotation(data["count-help-current"])
        }else{
            chc.value = calcGeneral.expFormat(data["count-help-current"], 20)
        }
        chc.placeholder = input.checked ? "<empty>" : "0"
        chc.style.borderColor = "white"
    }],
    "count-help-current": ["input", 0, (input) => {
        if(input.value.length == 0) {
            delete realData[input.id]
            input.style.borderColor = "white"
            update()
            return;
        }
        if(data["count-help-isletter"])parseLetter(input, false)
        else parseNumeric(input, false)
    }],
    "count-help-button": ["click", undefined, button => {
        button.disabled = true
        setTimeout(() => button.disabled = false, 200)
        if(data["count-help-diff"]){
            let out = advCount()
            if(out !== undefined)navigator.clipboard.writeText(out)
        }else{
            navigator.clipboard.writeText(basicCount())
        }
    }],
    "count-help-init": ["click", undefined, button => {
        button.disabled = true
        setTimeout(() => button.disabled = false, 200)
        if(data["count-help-diff"]){
            initAdvCount()
        }else{
            basicCount(data["count-help-basic-position"], 0)
        }
    }],
    "thread-convert-number": ["input", 1, input => {
        let tcl = elements["thread-convert-letter"]
        if(input.value.length == 0) {
            delete realData[input.id]
            tcl.value = ""
            tcl.style.borderColor = "white"
            input.style.borderColor = "white"
            return;
        }
        parseNumeric(input, false)
        if(input.style.borderColor != "red") {
            tcl.value = calcThread.convertLetterNotation(data[input.id])
            tcl.style.borderColor = "white"
        }
    }],
    "thread-convert-letter": ["input", 0, input => {
        let tcn = elements["thread-convert-number"]
        if(input.value.length == 0) {
            delete realData["thread-convert-number"]
            tcn.value = ""
            tcn.style.borderColor = "white"
            input.style.borderColor = "white"
            return;
        }
        parseLetter(input, false, {id: "thread-convert-number"})
        if(input.style.borderColor != "red") {
            tcn.value = data["thread-convert-number"]
            tcn.style.borderColor = "white"
        }
    }],
    "count-help-basic-counters": ["input", 2, input => {
        data[input.id] = input.valueAsNumber
        elements["count-help-basic-counters-amt"].textContent = input.value
        elements["count-help-basic-position"].max = input.value
        data["count-help-basic-position"] = Math.min(data["count-help-basic-position"], input.valueAsNumber)
        elements["count-help-basic-position"].value = data["count-help-basic-position"]
        elements["count-help-basic-position-place"].textContent = toPlace(data["count-help-basic-position"])
    }],
    "count-help-diff": ["change", false, input => {
        data[input.id] = input.checked
        elements["count-help-basic"].style.display = input.checked ? "none" : ""
        elements["count-help-adv"].style.display = input.checked ? "" : "none"
    }],
    "count-help-adv-counts": ["change", 2, input => {
        parseNumeric(input, false, {min: 2, max: 99})
        if(input.style.borderColor == "white") {
            adjustAdvContainer()
        }
    }],
    "thread-completions": ["input", 0, input => {
        data[input.id] = input.valueAsNumber
        elements["thread-completions-revamt"].textContent =
            data[input.id] == 0 ? "not completed" : 4 - data[input.id]
        update()
    }],
    "upg-has31": ["change", false, input => {
        data[input.id] = input.checked
        elements["general-role-none"].disabled = input.checked
        elements["general-role-red"].disabled = input.checked
        elements["general-role-green"].disabled = input.checked
        elements["general-role-blue"].disabled = input.checked
        update()
    }],
    "save-export": ["click", undefined, () => {
        saving.export()
    }],
    "save-import": ["click", undefined, () => {
        saving.import()
    }],
    "channel-g6": ["change", false, input => {
        data[input.id] = input.checked
        if(input.checked) {
            alert("yay you win!")
        }
    }]
}

const customData = {
    "count-help-current": function(input, value) {
        if(data["count-help-isletter"]) {
            input.value = calcThread.convertLetterNotation(value)
        }else{
            input.value = calcGeneral.expFormat(value, 20)
        }
    },
    "thread-convert-number": function(input, value) {
        input.value = value
        elements["thread-convert-letter"].value = calcThread.convertLetterNotation(value)
    },
    "count-help-adv-cycle": () => {},
    "count-help-adv-current": () => {},
    "general-role": function(_, value) {
        elements[`general-role-${value}`].checked = true
    }
}

function initializeInputs() {
    generateUpgGrid()

    Object.entries(customInputs).forEach(input => {
        let inputEle = document.getElementById(input[0])
        let ci = input[1]
        if(ci[1] !== undefined)placeholders[input[0]] = ci[1]
        inputEle.addEventListener(ci[0], () => ci[2](inputEle))
    })
    let inputs = document.getElementsByTagName("input")
    for(let x = 0; x < inputs.length; x++) {
        let input = inputs[x]
        elements[input.id] = input
        if(customInputs[input.id]) {
            continue;
        }
        switch(input.type){
        case "radio":
            if(input.checked)placeholders[input.name] = input.value
            input.checked = data[input.name] == input.value
            input.addEventListener("change", () => {
                data[input.name] = input.value
                update()
            })
            break;
        case "checkbox":
            placeholders[input.id] = input.checked ?? false
            input.addEventListener("change", () => {
                data[input.id] = input.checked
                if(!input.dataset.noUpdate)update()
            })
            break;
        case "range":
            placeholders[input.id] = Number(input.value)
            let amt = document.getElementById(input.id+"-amt")
            let place = document.getElementById(input.id+"-place")
            if(amt){
                amt.textContent = data[input.id]
                input.addEventListener("input", () => {
                    data[input.id] = input.valueAsNumber
                    amt.textContent = input.value
                    if(!input.dataset.noUpdate)update()
                })
                break;
            }
            if(place){
                place.textContent = data[input.id].toFixed(0) + (["st","nd","rd","th"])[Math.min(data[input.id]-1,3)]
                input.addEventListener("input", () => {
                    data[input.id] = input.valueAsNumber
                    place.textContent = input.value + (["st","nd","rd","th"])[Math.min(input.valueAsNumber-1,3)]
                    if(!input.dataset.noUpdate)update()
                })
                break;
            }
            input.addEventListener("input", () => {
                data[input.id] = input.valueAsNumber
                if(!input.dataset.noUpdate)update()
            })
            break;
        case "number":
            placeholders[input.id] = Number(input.value)
            input.addEventListener("input", () => {
                data[input.id] = input.valueAsNumber
                if(!input.dataset.noUpdate)update()
            })
            break;
        default:
            placeholders[input.id] = Number(input.placeholder)
            input.addEventListener("input", () => {
                if(input.value.length == 0) {
                    delete realData[input.id]
                    input.style.borderColor = "white"
                    if(!input.dataset.noUpdate)update()
                    return;
                }
                parseNumeric(
                    input,
                    !input.dataset.noUpdate,
                    {min: Number(input.dataset.min ?? 0), max: Number(input.dataset.max ?? Infinity)}
                )
            })
            break;
        }
    }

    Object.entries(realData).forEach(arr => {
        let ele = document.getElementById(arr[0])
        if(customData[arr[0]]) {
            customData[arr[0]](ele, arr[1])
            return;
        }
        if(ele === null){
            delete realData[arr[0]]
        }else{
            if(ele.type == "checkbox") {
                ele.checked = arr[1]
            }else {
                ele.value = arr[1]
            }
        }
    })

    elements["count-help-current"].placeholder = data["count-help-isletter"] ? "<empty>" : "0"
    elements["count-help-basic-position"].max = data["count-help-basic-counters"]
    elements["count-help-basic-position"].value = data["count-help-basic-position"]
    elements["count-help-basic-counters-amt"].textContent = data["count-help-basic-counters"]
    elements["count-help-basic"].style.display = data["count-help-diff"] ? "none" : ""
    elements["count-help-adv"].style.display = data["count-help-diff"] ? "" : "none"
    elements["thread-completions-revamt"].textContent =
        data["thread-completions"] == 0 ? "not completed" : 4 - data["thread-completions"]
    elements["general-role-none"].disabled = data["upg-has31"]
    elements["general-role-red"].disabled = data["upg-has31"]
    elements["general-role-green"].disabled = data["upg-has31"]
    elements["general-role-blue"].disabled = data["upg-has31"]
    initializeAdvContainer()
}

function init() {
    window.onbeforeunload = () => {
        saving.save()
    }

    saving.load()
    initUpdate()
    initializeInputs()
    update()
}

init()