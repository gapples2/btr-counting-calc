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

function parseNumeric(input) {
    let num = Number(input.value)
    if(!Number.isNaN(num) && !input.value.endsWith(".")) {
        data[input.id] = num
        input.style.borderColor = "white"
        update()
    }else{
        input.style.borderColor = "red"
    }
}

function initializeInputs() {
    let inputs = document.getElementsByTagName("input")
    for(let x = 0; x < inputs.length; x++) {
        let input = inputs[x]
        switch(input.type){
        case "checkbox":
            placeholders[input.id] = false
            if(input.id == "count-help-isletter") {
                input.addEventListener("change", () => {
                    data[input.id] = input.checked
                    if(input.checked) {
                        document.getElementById("count-help-current").value = calcThread.convertLetterNotation(data["count-help-current"])
                    }else{
                        document.getElementById("count-help-current").value = calcMsgs.expFormat(data["count-help-current"], 4)
                    }
                })
            }
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
            if(input.id == "count-help-current") {
                placeholders[input.id] = 0
                input.addEventListener("input", () => {
                    if(input.value.length == 0) {
                        delete realData[input.id]
                        update()
                        return;
                    }
                    if(data["count-help-isletter"]) {
                        if(/[A-Z]+$/.test(input.value)) {
                            data[input.id] = calcThread.parseLetterNotation(input.value)
                            input.style.borderColor = "white"
                            update()
                        }else{
                            input.style.borderColor = "red"
                        }
                    }else parseNumeric(input)
                })
                break;
            }
            placeholders[input.id] = Number(input.placeholder)
            input.addEventListener("input", () => {
                if(input.value.length == 0) {
                    delete realData[input.id]
                    update()
                    return;
                }
                parseNumeric(input)
            })
            break;
        }
    }

    Object.entries(realData).forEach(arr => {
        let ele =document.getElementById(arr[0])
        if(ele === null){
            delete realData[arr[0]]
        }else{
            if(ele.id == "count-help-current" && data["count-help-isletter"]) {
                ele.value = calcThread.convertLetterNotation(arr[1])
                return;
            }
            ele.value = arr[1]
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
            let count = calcMsgs.expFormat(data["count-help-current"] + data["count-help-cpm"] * mult, 4)
            document.getElementById("count-help-current").value = count
            data["count-help-current"] = Number(count)
            navigator.clipboard.writeText(count)
        }
    })
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