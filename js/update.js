let elementIds = ["msg-chain", "msg-red-num", "thread-ntl-result"]
let elements = {}

function initUpdate() {
    elementIds.forEach(str => elements[str] = document.getElementById(str))
    update()
}

function update() {
    elements["msg-red-num"].textContent = data["msg-red"].toFixed(0)
    let chain = calcMsgs.msgChain()
    if(chain.length == 0) {
        elements["msg-chain"].innerHTML = "<span>None.</span><br>"
        return;
    }
    elements["msg-chain"].innerHTML = chain.map(arr => `<div class="column" style="padding-right:10px;height:75px"><div class="row" style="white-space:nowrap">${arr[0]} CPM</div><div class="row">${calcMsgs.formatWhole(arr[1])} msgs</div></div>`).join("")

    elements["thread-ntl-result"].textContent = calcThread.convertLetterNotation(data["thread-ntl-convert"])
}