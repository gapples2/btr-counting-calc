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

function initializeInputs() {
    let inputs = document.getElementsByTagName("input")
    for(let x = 0; x < inputs.length; x++) {
        let input = inputs[x]
        switch(input.type){
        case "checkbox":
            placeholders[input.id] = false
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
                    update()
                    return;
                }
                let num = Number(input.value)
                if(!Number.isNaN(num) && !input.value.endsWith(".")) {
                    data[input.id] = num
                    input.style.borderColor = "white"
                    update()
                }else{
                    input.style.borderColor = "red"
                }
            })
            break;
        }
    }

    Object.entries(realData).forEach(arr => {
        let ele =document.getElementById(arr[0])
        if(ele === null){
            delete realData[arr[0]]
        }else ele.value = arr[1]
    })

    document.getElementById("thread-help-button").addEventListener("click", () => {
        let count = calcMsgs.expFormat(data["thread-help-count"] + data["thread-help-cpm"] * 2, 3)
        document.getElementById("thread-help-count").value = count
        data["thread-help-count"] = Number(count)
        navigator.clipboard.writeText(count)
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