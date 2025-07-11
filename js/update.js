let elementIds = [
    "msg-red-num",
    "msg-chain",
    "time-cpm",
    "member-cpm", "member-estimate",
    "thread-cpm",
        "thread-coins-copm", "thread-coins-upg3-amt",
        "thread-candy-caupg2-amt",
        "thread-candy-player-hp", "thread-candy-player-maxhp", "thread-candy-player-atk", "thread-candy-player-def",
        "thread-candy-enemy-hp", "thread-candy-enemy-maxhp", "thread-candy-enemy-atk", "thread-candy-enemy-def",
        "thread-candy-player-trueatk", "thread-candy-enemy-trueatk",
        "thread-candy-attacks", "thread-candy-counts",
        "thread-capacitors-pos-amt", "thread-capacitors-neutral-amt", "thread-capacitors-neg-amt",
        "thread-capacitors-pos-boost", "thread-capacitors-neutral-boost", "thread-capacitors-neg-boost",
    "general", "msg", "time", "member", "thread", "count-help"
]
let elements = {}

function initUpdate() {
    elementIds.forEach(str => elements[str] = document.getElementById(str))
    update()
}

function update() {
    // general

    // msg
    elements["msg-red-num"].textContent = data["msg-red"].toFixed(0)
    let chain = calcMsgs.msgChain()
    if(chain.length == 0) {
        elements["msg-chain"].innerHTML = "<span>None.</span><br>"
        return;
    }
    elements["msg-chain"].innerHTML = chain.map(arr => `<div class="column" style="padding-right:10px;height:75px"><div class="row" style="white-space:nowrap">${arr[0]} CPM</div><div class="row">${calcGeneral.formatWhole(arr[1])} msgs</div></div>`).join("")

    // time
    elements["time-cpm"].textContent = calcGeneral.expFormat(calcTime.cpm(), data["general-sigfig"] - 1)

    // member
    elements["member-cpm"].textContent = calcGeneral.expFormat(calcMember.cpm(), data["general-sigfig"] - 1)
    elements["member-estimate"].textContent = calcGeneral.expFormat(calcMember.estimatedMembers(), data["general-sigfig"] - 1)

    // thread
    elements["thread-cpm"].textContent = `${calcGeneral.expFormat(calcThread.cpm(), data["general-sigfig"] - 1)} (${calcThread.convertLetterNotation(calcThread.cpm())})`
    // coins
    elements["thread-coins-copm"].textContent = calcGeneral.expFormat(calcThread.coins.copm(), data["general-sigfig"] - 1)
    elements["thread-coins-upg3-amt"].textContent = data["thread-coins-upg3"].toFixed(0)
    // candy
    elements["thread-candy-caupg2-amt"].textContent = data["thread-candy-caupg2"].toFixed(0)
    let playerHP = calcThread.candy.player.hp()
    placeholders["thread-candy-player-hp"] = playerHP
    elements["thread-candy-player-hp"].placeholder = calcGeneral.formatWhole(playerHP)
    elements["thread-candy-player-maxhp"].textContent = calcGeneral.formatWhole(playerHP)
    elements["thread-candy-player-atk"].textContent = calcGeneral.formatWhole(calcThread.candy.player.atk())
    elements["thread-candy-player-trueatk"].textContent = calcGeneral.formatWhole(Math.floor(calcThread.candy.player.atk() / calcThread.candy.enemy.def()))
    elements["thread-candy-player-def"].textContent = calcGeneral.formatWhole(calcThread.candy.player.def())
    let enemyHP = calcThread.candy.enemy.hp()
    placeholders["thread-candy-enemy-hp"] = enemyHP
    elements["thread-candy-enemy-hp"].placeholder = calcGeneral.formatWhole(enemyHP)
    elements["thread-candy-enemy-maxhp"].textContent = calcGeneral.formatWhole(enemyHP)
    elements["thread-candy-enemy-atk"].textContent = calcGeneral.formatWhole(calcThread.candy.enemy.atk())
    elements["thread-candy-enemy-trueatk"].textContent = calcGeneral.formatWhole(Math.floor(calcThread.candy.enemy.atk() / calcThread.candy.player.def()))
    elements["thread-candy-enemy-def"].textContent = calcGeneral.formatWhole(calcThread.candy.enemy.def())
    elements["thread-candy-attacks"].textContent = calcGeneral.formatWhole(calcThread.candy.attacksToKill())
    elements["thread-candy-counts"].textContent = calcGeneral.formatWhole(calcThread.candy.countsToKill())
    // capacitors
    elements["thread-capacitors-pos-amt"].textContent = data["thread-capacitors-pos"].toFixed(0)
    elements["thread-capacitors-neutral-amt"].textContent = data["thread-capacitors-neutral"].toFixed(0)
    elements["thread-capacitors-neg-amt"].textContent = data["thread-capacitors-neg"].toFixed(0)
    elements["thread-capacitors-pos-boost"].textContent = calcThread.capacitors.pos().toLocaleString("en-US")
    elements["thread-capacitors-neutral-boost"].textContent = calcThread.capacitors.neutral().toLocaleString("en-US")
    elements["thread-capacitors-neg-boost"].textContent = calcThread.capacitors.neg().toLocaleString("en-US")

    // tabs
    elements["general"].style.display = data["general-hide"] ? "none" : ""
    elements["msg"].style.display = data["msg-hide"] ? "none" : ""
    elements["time"].style.display = data["time-hide"] ? "none" : ""
    elements["member"].style.display = data["member-hide"] ? "none" : ""
    elements["thread"].style.display = data["thread-hide"] ? "none" : ""
    elements["count-help"].style.display = data["count-help-hide"] ? "none" : ""
}