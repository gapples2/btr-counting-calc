let elementIds = [
    "general-role-none", "general-role-red", "general-role-blue", "general-role-green", "general-counts",
    "msg-chain", "msg-upg-cost", "msg-upg-uc",
    "time-cpm", "time-factor-max", "time-counts", "time-slots",
    "member-cpm", "member-estimate",
    "thread-cpm",
        "thread-convert-number", "thread-convert-letter", "thread-completions-revamt",
        "thread-coins-copm",
        "thread-candy-player-hp", "thread-candy-player-maxhp", "thread-candy-player-atk", "thread-candy-player-def",
        "thread-candy-enemy-hp", "thread-candy-enemy-maxhp", "thread-candy-enemy-atk", "thread-candy-enemy-def",
        "thread-candy-player-trueatk", "thread-candy-enemy-trueatk",
        "thread-candy-attacks", "thread-candy-counts", "thread-candy-total", "thread-candy-spent",
        "thread-capacitors-pos-boost", "thread-capacitors-neutral-boost", "thread-capacitors-neg-boost",
    "upg-grid", "upg-cpm", "upg-used", "upg-sprawlers",
    "channel-cpm", "channel-counts",
    "count-help-current", "count-help-basic-position", "count-help-basic-counters-amt", "count-help-basic-position-place",
    "count-help-msgnum", "count-help-basic", "count-help-adv", "count-help-adv-cycle",
    "save-import-input",
    "general", "msg", "time", "member", "thread", "upg", "channel", "count-help", "save",
    "msg-all", "time-all", "member-all", "general-role-powers", "thread-all", "upg-all"
]
let elements = {}

function initUpdate() {
    elementIds.forEach(str => elements[str] = document.getElementById(str))
    //update()
}

function update() {
    // general
    elements["general-counts"].textContent = calcGeneral.maxCounts().toFixed(0)

    // msg
    //elements["msg-red-num"].textContent = data["msg-red"].toFixed(0)
    if(!data["channel-g1"]) {
        let chain = calcMsgs.msgChain()
        if(chain.length == 0) {
            elements["msg-chain"].innerHTML = "<span>None.</span><br>"
            return;
        }
        elements["msg-chain"].innerHTML = chain.map(arr => `<div class="column" style="padding-right:10px;height:75px"><div class="row" style="white-space:nowrap">${arr[0]} CPM</div><div class="row">${calcGeneral.formatWhole(arr[1])} count(s)</div></div>`).join("")
        elements["msg-upg-cost"].textContent = calcMsgs.uc.totalCost().toFixed(0)
        elements["msg-upg-uc"].textContent = calcMsgs.uc.total().toFixed(0)
    }

    // time
    if(!data["channel-g2"]) {
        elements["time-cpm"].textContent = calcGeneral.expFormat(calcTime.cpm())
        elements["time-factor-max"].textContent = calcTime.factor().toFixed(2).replace(/\.?0+$/,"")
        elements["time-counts"].textContent = calcGeneral.expFormat(Math.ceil(calcTime.goal() / calcGeneral.expNumber(calcTime.cpm())))
        setPlaceholder("time-slots", calcTime.challengeSum())
    }

    // member
    if(!data["channel-g3"]) {
        elements["member-cpm"].textContent = calcGeneral.expFormat(calcMember.cpm())
        elements["member-estimate"].textContent = calcGeneral.expFormat(calcMember.estimatedMembers(), 10)
    }

    // thread
    if(!data["channel-g4"]) {
        elements["thread-cpm"].textContent = `${calcGeneral.expFormat(calcThread.cpm(), data["general-sigfig"] - 1)} (${calcThread.convertLetterNotation(calcThread.cpm())})`
        // coins
        elements["thread-coins-copm"].textContent = calcGeneral.expFormat(calcThread.coins.copm(), data["general-sigfig"] - 1)
        //elements["thread-coins-upg3-amt"].textContent = data["thread-coins-upg3"].toFixed(0)
        // candy
        //elements["thread-candy-caupg2-amt"].textContent = data["thread-candy-caupg2"].toFixed(0)
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
        elements["thread-candy-total"].textContent = calcGeneral.expFormat(calcThread.candy.total())
        elements["thread-candy-spent"].textContent = calcGeneral.expFormat(calcThread.candy.spent())
        // capacitors
        //elements["thread-capacitors-pos-amt"].textContent = data["thread-capacitors-pos"].toFixed(0)
        //elements["thread-capacitors-neutral-amt"].textContent = data["thread-capacitors-neutral"].toFixed(0)
        //elements["thread-capacitors-neg-amt"].textContent = data["thread-capacitors-neg"].toFixed(0)
        elements["thread-capacitors-pos-boost"].textContent = calcThread.capacitors.pos().toLocaleString("en-US")
        elements["thread-capacitors-neutral-boost"].textContent = calcThread.capacitors.neutral().toLocaleString("en-US")
        elements["thread-capacitors-neg-boost"].textContent = calcThread.capacitors.neg().toLocaleString("en-US")
    }

    // upg
    if(!data["channel-g5"]) {
        elements["upg-cpm"].textContent = calcGeneral.expFormat(calcUpg.cpm())
        elements["upg-sprawlers"].textContent = calcUpg.sumUpgCosts().toFixed(0)
        elements["upg-used"].textContent = calcUpg.upgAmt().toFixed(0)
    }

    // channel
    elements["channel-cpm"].textContent = calcGeneral.expFormat(calcChannel.cpm())
    elements["channel-counts"].textContent = calcChannel.counts().toFixed(0)

    // tabs
    elements["general"].style.display = data["general-hide"] ? "none" : ""
    elements["msg"].style.display = data["msg-hide"] ? "none" : ""
    elements["time"].style.display = data["time-hide"] ? "none" : ""
    elements["member"].style.display = data["member-hide"] ? "none" : ""
    elements["thread"].style.display = data["thread-hide"] ? "none" : ""
    elements["upg"].style.display = data["upg-hide"] ? "none" : ""
    elements["count-help"].style.display = data["count-help-hide"] ? "none" : ""
    elements["save"].style.display = data["save-hide"] ? "none" : ""

    // annihilate
    elements["msg-all"].style.display = data["channel-g1"] ? "none" : ""
    elements["time-all"].style.display = data["channel-g2"] ? "none" : ""
    elements["member-all"].style.display = data["channel-g3"] ? "none" : ""
    elements["general-role-powers"].style.display = data["channel-g3"] ? "none" : ""
    elements["thread-all"].style.display = data["channel-g4"] ? "none" : ""
    elements["upg-all"].style.display = data["channel-g5"] ? "none" : ""
}