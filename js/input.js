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

const saveKey = "btr-counting-calc-save"
function loadData() {
    let save = localStorage.getItem(saveKey)
    if(save === null)return;
    realData = JSON.parse(save)
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

const customInputs = {
    "count-help-isletter": ["change", false, (input) => {
        let chc = elements["count-help-current"]
        data[input.id] = input.checked
        if(input.checked) {
            chc.value = calcThread.convertLetterNotation(data["count-help-current"])
        }else{
            chc.value = calcGeneral.expFormat(data["count-help-current"], 4)
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
    "count-help-button": ["click", undefined, () => {
        if(data["count-help-diff"]){
            let out = advCount()
            if(out !== undefined)navigator.clipboard.writeText(out)
        }else{
            navigator.clipboard.writeText(basicCount())
        }
    }],
    "count-help-init": ["click", undefined, () => {
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
        elements["thread-completions-revamt"].textContent = 3 - data[input.id]
        update()
    }]
}

const customData = {
    "count-help-current": function(input, value) {
        if(data["count-help-isletter"]) {
            input.value = calcThread.convertLetterNotation(value)
        }else{
            input.value = value
        }
    },
    "thread-convert-number": function(input, value) {
        input.value = value
        elements["thread-convert-letter"].value = calcThread.convertLetterNotation(value)
    },
    "count-help-adv-cycle": () => {},
    "count-help-adv-current": () => {}
}

function initializeInputs() {
    Object.entries(customInputs).forEach(input => {
        let inputEle = document.getElementById(input[0])
        let ci = input[1]
        if(ci[1] !== undefined)placeholders[input[0]] = ci[1]
        inputEle.addEventListener(ci[0], () => ci[2](inputEle))
    })
    let inputs = document.getElementsByTagName("input")
    for(let x = 0; x < inputs.length; x++) {
        let input = inputs[x]
        if(customInputs[input.id]) {
            continue;
        }
        switch(input.type){
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
        if(ele === null){
            delete realData[arr[0]]
        }else{
            if(customData[arr[0]]) {
                customData[arr[0]](ele, arr[1])
                return;
            }
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
    elements["thread-completions-revamt"].textContent = 3 - data["thread-completions"]
    initializeAdvContainer()
}

function init() {
    window.onbeforeunload = () => {
        localStorage.setItem(saveKey, JSON.stringify(realData))
    }

    loadData()
    initUpdate()
    initializeInputs()
    update()
}

init()