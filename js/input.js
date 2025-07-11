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

function parseNumeric(input, dataId=input.id, value=input.value, doUpdate=true) {
    let num = Number(value.replaceAll(",",""))
    if(num >= 0 && !Number.isNaN(num) && !value.endsWith(".")) {
        data[dataId] = num
        input.style.borderColor = "white"
        if(doUpdate)update()
    }else{
        input.style.borderColor = "red"
    }
}

function parseLetter(input, dataId=input.id, value=input.value, doUpdate=true) {
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
        let chc = document.getElementById("count-help-current")
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
        if(data["count-help-isletter"])parseLetter(input)
        else parseNumeric(input)
    }],
    "thread-convert-number": ["input", 1, input => {
        let tcl = document.getElementById("thread-convert-letter")
        if(input.value.length == 0) {
            delete realData[input.id]
            tcl.value = ""
            tcl.style.borderColor = "white"
            input.style.borderColor = "white"
            return;
        }
        parseNumeric(input, input.id, input.value, false)
        if(input.style.borderColor != "red") {
            tcl.value = calcThread.convertLetterNotation(data[input.id])
            tcl.borderColor = "white"
        }
    }],
    "thread-convert-letter": ["input", 0, input => {
        let tcn = document.getElementById("thread-convert-number")
        if(input.value.length == 0) {
            delete realData["thread-convert-number"]
            tcn.value = ""
            tcn.style.borderColor = "white"
            input.style.borderColor = "white"
            return;
        }
        parseLetter(input, "thread-convert-number", input.value, false)
        if(input.style.borderColor != "red") {
            tcn.value = data["thread-convert-number"]
            tcn.borderColor = "white"
        }
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
        document.getElementById("thread-convert-letter").value = calcThread.convertLetterNotation(value)
    }
}

function initializeInputs() {
    let inputs = document.getElementsByTagName("input")
    for(let x = 0; x < inputs.length; x++) {
        let input = inputs[x]
        if(customInputs[input.id]) {
            let ci = customInputs[input.id]
            placeholders[input.id] = ci[1]
            input.addEventListener(ci[0], () => ci[2](input))
            continue;
        }
        switch(input.type){
        case "checkbox":
            placeholders[input.id] = input.checked ?? false
            input.addEventListener("change", () => {
                data[input.id] = input.checked
                update()
            })
            break;
        case "range":
            placeholders[input.id] = Number(input.value)
            input.addEventListener("input", () => {
                data[input.id] = input.valueAsNumber
                update()
            })
            break;
        default:
            placeholders[input.id] = Number(input.placeholder)
            input.addEventListener("input", () => {
                if(input.value.length == 0) {
                    delete realData[input.id]
                    input.style.borderColor = "white"
                    update()
                    return;
                }
                parseNumeric(input)
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

    document.getElementById("count-help-button").addEventListener("click", () => {
        let mult = data["count-help-firstcounter"] ? 1 : 2
        data["count-help-firstcounter"] = false
        document.getElementById("count-help-firstcounter").checked = false
        if(data["count-help-isletter"]) {
            let count = data["count-help-current"] + data["count-help-cpm"] * mult
            let asLetter = calcThread.convertLetterNotation(count)
            document.getElementById("count-help-current").value = asLetter
            data["count-help-current"] = count
            navigator.clipboard.writeText(asLetter)
        }else{
            let count = calcGeneral.expFormat(data["count-help-current"] + data["count-help-cpm"] * mult, 4)
            document.getElementById("count-help-current").value = count
            data["count-help-current"] = Number(count)
            navigator.clipboard.writeText(count)
        }
    })

    document.getElementById("count-help-current").placeholder = data["count-help-isletter"] ? "<empty>" : "0"
}

function init() {
    window.onbeforeunload = () => {
        localStorage.setItem(saveKey, JSON.stringify(realData))
    }

    loadData()
    initializeInputs()
    initUpdate()
}

init()