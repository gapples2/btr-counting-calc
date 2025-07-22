function toPlace(num) {
    return num+(["st","nd","rd","th"])[Math.min(num-1,3)]
}

function basicCount(counters=data["count-help-basic-counters"], loopCounts=data["count-help-basic-counts"]) {
    let chc = elements["count-help-current"]
    let numCounts = data["count-help-basic-counts"]
    let arr = []
    let cpm = data["count-help-basic-cpm"]
    for(let x=1;x<=loopCounts;x++){
        let count = data["count-help-current"] + cpm
        data["count-help-current"] = count
        arr.push(
            data["count-help-isletter"] ?
            calcThread.convertLetterNotation(data["count-help-current"]) :
            calcGeneral.expFormat(data["count-help-current"], 20)
        )
        if(data["count-help-addmsgnum"]) {
            data["count-help-msgnum"] = data["count-help-msgnum"] + 1
            arr[arr.length - 1] += " " + data["count-help-msgnum"].toFixed(0)
        }
    }
    data["count-help-current"] = Math.round(data["count-help-current"] + cpm * (counters - 1) * numCounts)
    chc.value = data["count-help-isletter"] ?
        calcThread.convertLetterNotation(data["count-help-current"]) :
        calcGeneral.expFormat(data["count-help-current"], 20)
    if(data["count-help-addmsgnum"]) {
        data["count-help-msgnum"] += (counters - 1) * numCounts
        elements["count-help-msgnum"].value = data["count-help-msgnum"].toFixed(0)
    }
    return arr.join("\n")
}

function generateAdvContainer() {
    if(!realData["count-help-adv-cycle"]) {
        realData["count-help-adv-cycle"] = []
    }
    if(!elements["count-help-adv-arr"]) {
        elements["count-help-adv-arr"] = []
    }
    let num = elements["count-help-adv-arr"].length
    let id = `count-help-adv-count${num}`
    let div = document.createElement("div")
    div.id = id
    div.style.minWidth = "250px"
    div.innerHTML = `
    <div class="row">count ${num + 1}</div>
    <div class="row"><label>same as:</label><input id="${id}-same" placeholder="<none>" style="width:75px"></div>
    <div class="row"><label>your count?</label><input id="${id}-you" type="checkbox"></div>
    <div class="row"><label>cpm:</label><input id="${id}-cpm" placeholder="0"></div>
    `
    elements["count-help-adv-cycle"].appendChild(div)
    let obj = {
        you: document.getElementById(`${id}-you`),
        same: document.getElementById(`${id}-same`),
        cpm: document.getElementById(`${id}-cpm`),
        div
    }
    elements["count-help-adv-arr"].push(obj)

    let countData = realData["count-help-adv-cycle"][num]
    let sameFunc = () => {
        if(countData.same !== "") {
            obj.you.disabled = true
            obj.cpm.disabled = true
            let same = countData.same
            while(realData["count-help-adv-cycle"][same].same !== "") {
                same = realData["count-help-adv-cycle"][same].same
            }
            obj.you.checked = realData["count-help-adv-cycle"][same].you
            obj.cpm.value = realData["count-help-adv-cycle"][same].cpm
        }else{
            obj.you.disabled = false
            obj.cpm.disabled = false
            obj.you.checked = countData.you
            obj.cpm.value = countData.cpm
        }
    }

    if(countData) {
        if(countData.same === "") {
            obj.you.checked = countData.you
            obj.cpm.value = calcGeneral.expFormat(countData.cpm)
        }else obj.same.value = countData.same + 1
        sameFunc()
    }else{
        realData["count-help-adv-cycle"].push({
            same: "",
            you: false,
            cpm: 1,
            linked: []
        })
        countData = realData["count-help-adv-cycle"].at(-1)
    }

    let updateLinked = (val, updId, arr) => {
        arr.forEach(id => {
            let linkedData = realData["count-help-adv-cycle"][id]
            let linkEles = elements["count-help-adv-arr"][id]
            let ele = linkEles[updId]
            ele[ele.type == "checkbox" ? "checked" : "value"] = val
            updateLinked(val, updId, linkedData.linked)
        })
    }

    obj.same.addEventListener("change", () => {
        let n = Number(obj.same.value)
        if(
            (obj.same.value != "") &&
            (n < 1 || n > num || !Number.isFinite(n) || obj.same.value.endsWith(".")))
        {
            obj.same.style.borderColor = "red"
            return;
        }
        n--
        obj.same.style.borderColor = "white"
        if(countData.same !== "") {
            let linkedData = realData["count-help-adv-cycle"][countData.same]
            linkedData.linked.splice(linkedData.linked.indexOf(num), 1)
        }
        countData.same = obj.same.value == "" ? "" : n
        sameFunc()
        if(countData.same !== "") {
            let linkedData = realData["count-help-adv-cycle"][countData.same]
            linkedData.linked.push(num)
        }
    })
    obj.you.addEventListener("change", () => {
        countData.you = obj.you.checked
        updateLinked(countData.you, "you", countData.linked)
    })
    obj.cpm.addEventListener("change", () => {
        let n = Number(obj.cpm.value)
        if(n < 0 || !Number.isFinite(n) || obj.cpm.value.endsWith(".")) {
            obj.cpm.style.borderColor = "red"
            return;
        }
        obj.cpm.style.borderColor = "white"
        countData.cpm = n
        updateLinked(calcGeneral.expFormat(countData.cpm, 20), "cpm", countData.linked)
    })

    elements["count-help-adv-cycle"].appendChild(div)
}

function removeAdvContainer() {
    Object.values(elements["count-help-adv-arr"].pop()).forEach(e=>{
        if(e)e.remove()
    })
    data["count-help-adv-cycle"].pop()
}

function adjustAdvContainer(amt=data["count-help-adv-counts"]) {
    let dataArr = data["count-help-adv-cycle"]
    if(!dataArr) {
        data["count-help-adv-cycle"] = []
        dataArr = data["count-help-adv-cycle"]
    }
    for(let x=dataArr.length;x<amt;x++) {
        generateAdvContainer()
    }
    for(let x=dataArr.length;x>amt;x--) {
        removeAdvContainer()
    }
    data["count-help-adv-current"] = -1
}

function initializeAdvContainer() {
    for(let x=0;x<data["count-help-adv-counts"];x++) {
        generateAdvContainer()
    }
    data["count-help-adv-current"] = -1
}

function readAdvProperty(prop) {
    let curr = data["count-help-adv-current"]
    let countData = data["count-help-adv-cycle"][curr]
    while(countData.same !== "") {
        curr = countData.same
        countData = data["count-help-adv-cycle"][curr]
    }
    return countData[prop]
}

function getAdvCpm() {
    return readAdvProperty("cpm")
}

function getAdvYou() {
    return readAdvProperty("you")
}

function nextAdvCount() {
    let count = data["count-help-current"]
    let str = ""
    let cpm = getAdvCpm()
    if(data["count-help-isletter"]) {
        count = Math.round(count + cpm)
        str = calcThread.convertLetterNotation(count)
    }else {
        cpm = calcGeneral.expNumber(cpm, 20)
        count = Math.round(count + cpm)
        str = calcGeneral.expFormat(count, 20)
    }
    data["count-help-current"] = count
    if(data["count-help-addmsgnum"]) {
        data["count-help-msgnum"] += 1
        str += " " + data["count-help-msgnum"].toFixed(0)
    }
    data["count-help-adv-current"] = (data["count-help-adv-current"] + 1) % data["count-help-adv-cycle"].length
    return str
}

function updateAdvCount() {
    elements["count-help-current"].value = 
        data["count-help-isletter"] ?
        calcThread.convertLetterNotation(data["count-help-current"]) :
        calcGeneral.expFormat(data["count-help-current"], 20)
    if(data["count-help-addmsgnum"]) {
        elements["count-help-msgnum"].value = data["count-help-msgnum"]
    }
}

function initAdvCount() {
    let first = -1
    for(let x=0;x<data["count-help-adv-cycle"].length;x++) {
        if(data["count-help-adv-cycle"][x].you) {
            first = x
            break;
        }
    }
    if(first==-1)return;
    data["count-help-adv-current"] = 0
    for(let x=0;x<first;x++){
        nextAdvCount()
    }
    updateAdvCount()
}

function advCount() {
    if(data["count-help-adv-current"] == -1)return;
    let arr = []
    for(let x=0;x<data["count-help-adv-cycle"].length&&getAdvYou();x++)arr.push(nextAdvCount());
    while(!getAdvYou())nextAdvCount();
    updateAdvCount()
    return arr.join("\n")
}