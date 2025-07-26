function multGTZ(num, mult) {
    if(mult > 0)return num * mult
    return num
}

const calcGeneral = {
    expFormat(num, p=data["general-sigfig"]-1) {
        if(!Number.isFinite(num))return "Infinity"
        if(num < 1000)return (Math.floor(num * 10 ** p) / 10 ** p).toFixed(0)
        let e = Math.floor(Math.log10(num))
        p = Math.min(p, e)
        let div = 10 ** (e - p)
        let m = Math.round((num - (num % div)) / div)
        m = m.toFixed(0).replace(/0+$/,"")
        m = m[0] + "." + m.slice(1)
        if(m.endsWith("."))m = m.slice(0, -1)
        return m + "e" + e.toFixed(0)
    },
    formatWhole(num) {
        if(num < 1e9)return num.toLocaleString("en-US", {maximumFractionDigits: 0})
        return this.expFormat(num)
    },
    expNumber(num, p=data["general-sigfig"]-1) {
        return Number(this.expFormat(num, p))
    },
    getRadioValue(name) {
        return document.querySelector(`input[name="${name}"]:checked`).value
    },
    maxCounts() {
        let counts = 1
        if(data['msg-upg8'] && !data["channel-g1"])counts++
        if(calcMember.isGreen())counts++
        if(calcUpg.has(21))counts += 2
        if(!data["channel-g1"])counts += data["msg-buyable3"]
        else counts += 5
        if(data["channel-g3"])counts += 2
        return counts
    },
    sumLinear(initial, scaling, val) {
        return (val * scaling / 2 + initial) * (val + 1)
    }
}

const calcMsgs = {
    uc: {
        upgCosts: [1, 1, 3, 3, 5, 6, 9, 16, 23],
        buyableCosts: [[5, 3], [3, 2], [6, 2], [10, 4]],
        getUpgs() {
            return Object.entries(realData).filter(arr => arr[0].startsWith("msg-upg") && arr[1] === true)
        },
        sumUpgCost() {
            // buyable-inator is always active now
            if(data["upg-has35"] || true)return 0
            return this.getUpgs().reduce((p, c) => p + this.upgCosts[Number(c[0].slice(7)) - 1], 0)
        },
        sumBuyableCost() {
            let sum = 0
            for(let x = 0; x < this.buyableCosts.length; x++) {
                let cost = this.buyableCosts[x]
                sum += calcGeneral.sumLinear(cost[0], cost[1], data[`msg-buyable${x + 1}`] - 1)
            }
            return sum
        },
        totalCost() {
            return this.sumUpgCost() + this.sumBuyableCost()
        },
        upgAmt() {
            if(data["channel-g1"])return 0
            let amt = this.getUpgs().length
            return amt
        },
        adjustedUpgAmt() {
            return Math.max(this.upgAmt() - (data["msg-upg1"] + data["msg-upg5"] + data["msg-upg8"] + data["msg-upg9"]), 0)
        }, 
        upgBoost() {
            if(data["channel-g1"])return 1
            let mult = 1
            if(data["msg-upg1"])mult *= 2
            if(data["msg-upg2"])mult *= this.upgAmt() + 1
            if(data["msg-upg3"])mult *= 3
            if(data["msg-upg6"])mult /= 2
            if(data["msg-upg7"])mult *= 50
            return mult
        },
        fromMsgs() {
            let msgs = data["msg-least"]
            if(data["msg-completions"] < 3) { 
                return (msgs <= 70) + (msgs <= 25) + (msgs <= 9) + (msgs <= 3) + (msgs <= 1)
            }
            return (msgs <= 15) + (msgs <= 1)
        },
        fromCompletions() {
            return Math.min(data["msg-completions"], 3) * 5 + Math.max(data["msg-completions"] - 3, 0) * 2
        },
        total() {
            return this.fromMsgs() + this.fromCompletions()
        }
    },
    baseCpm() {
        let base = Math.sqrt(800) ** (data["msg-completions"] + 1) / Math.sqrt(data["msg-least"])
        base *= this.uc.upgBoost()
        base *= calcTime.msgBoost()
        if(data["channel-i1"])base *= 100
        if(data["channel-i2"])base *= 100
        if(data["channel-i3"])base *= 100
        if(data["channel-g3"])base *= 10
        if(data["msg-upg6"])base **= 1.1
        return Math.round(base)
    },
    cpm() {
        let cpm = this.baseCpm()
        if(calcMember.isRed())cpm *= calcMember.redPower()
        return cpm
    },
    goal() {
        return 200 * 1000 ** (data["msg-completions"] + (data["msg-least"] == 1))
    },
    expectedMsgs(cpm=this.cpm(data)) {
        return Math.ceil(this.goal() / cpm)
    },
    msgChain() {
        let arr = []
        let originalMsg = realData["msg-least"]
        this.msgChainRecursion(arr)
        if(originalMsg === undefined)delete realData["msg-least"]
        else realData["msg-least"] = originalMsg
        return arr
    },
    msgChainRecursion(arr) {
        let cpm = calcGeneral.expFormat(this.cpm(), data["general-sigfig"] - 1)
        let msgs = this.expectedMsgs(Number(cpm))
        if(!Number.isFinite(Number(cpm)) || !Number.isFinite(msgs))return;
        if(arr.length > 0 && arr.at(-1)[1] <= msgs)return;
        arr.push([cpm, msgs])
        data["msg-least"] = msgs
        this.msgChainRecursion(arr)
    }
}

const calcTime = {
    factor() {
        if(data["channel-g2"])return 0
        return data["time-c3"] + data["time-c2"] / 2 + data["time-c1"] / 4
    },
    challengeSum() {
        if(data["channel-g2"])return 0
        return data["time-c1"] + data["time-c2"] + data["time-c3"]
    },
    msgBoost() {
        if(data["channel-g2"])return 1
        return Math.sqrt(800 / data["time-least"]) * Math.sqrt(1600) ** data["time-factor"]
    },
    memberBoost() {
        if(data["channel-g2"])return 1
        let mult = Math.sqrt(data["time-zen"] / 1000)
        if(calcUpg.has(12))mult **= 1.5
        return mult
    },
    baseCpm() {
        let cpm = calcMember.timeBoost()
        if(data["msg-upg4"] && !data["channel-g1"])cpm *= Math.round(calcMsgs.uc.upgBoost() ** 0.75)
        if(data["msg-upg5"] && !data["channel-g1"])cpm *= 3
        if(!data["channel-g4"])cpm *= 3 ** data["thread-coins-upg2"]
        if(calcUpg.has(23))cpm *= 3
        if(!data["channel-g1"])cpm *= 1.5 ** data["msg-buyable2"]
        if(data["channel-i1"])cpm *= 100
        if(data["channel-i2"])cpm *= 100
        if(data["channel-i3"])cpm *= 100
        if(data["channel-g1"])cpm *= 1e7
        if(data["channel-g3"])cpm *= 10
        return Math.round(cpm)
    },
    roleBoost() {
        let mult = 1
        if(calcMember.isRed())mult *= calcMember.redPower()
        if(calcUpg.has(41) && calcMember.isBlue())mult *= 5
        return mult
    },
    cpm() {
        return this.baseCpm() * this.roleBoost()
    },
    goal() {
        return 200 * 100 ** data["time-c3"]
    }
}

const calcMember = {
    timeBoost() {
        if(data["channel-g3"])return 1
        return Math.round(Math.sqrt(32) ** (data["member-completions"] + 1) / Math.sqrt(Math.max(data["member-least"], 0.5)))
    },
    baseCpm(upg9=data["msg-upg9"] && !data["channel-g1"]) {
        let cpm = 1
        if(!data["channel-g2"])cpm *= calcTime.memberBoost()
        if(upg9)cpm *= 10
        cpm *= calcThread.memberBoost()
        if(!data["channel-g1"])cpm *= 3 ** data["msg-buyable4"]
        if(data["channel-i1"])cpm *= 100
        if(data["channel-i2"])cpm *= 100
        if(data["channel-i3"])cpm *= 100
        if(data["channel-g1"])cpm *= 1000
        if(data["channel-g2"])cpm *= 1e10
        if(data["channel-g3"])cpm *= 10
        cpm = Math.round(cpm)
        return cpm
    },
    cpm() {
        let cpm = this.baseCpm()
        if(calcMember.isRed())cpm *= calcMember.redPower()
        return cpm
    },
    goal() {
        return 24 * 100 ** (data["member-completions"] + (data["member-least"] == 1))
    },
    estimatedMembersNoMinmax() {
        let counts = calcGeneral.maxCounts()
        let cpm = calcGeneral.expNumber(this.cpm())
        let goal = this.goal()
        if(cpm * (calcUpg.has(32) ? counts * 3 : 1) >= goal) {
            return 1
        }
        let countsNeeded = Math.ceil(goal / cpm)
        let membersNeeded = Math.ceil(countsNeeded / (counts * 3))
        return Math.max(membersNeeded, 2)
    },
    estimatedMembers() {
        if(!data["member-minmax"])return this.estimatedMembersNoMinmax()
        let countsFromMsgUpg = data["channel-g1"] ? 0 : data["msg-upg8"] + (data["msg-upg8"] && data["msg-upg9"])
        let counts = calcGeneral.maxCounts() - this.isGreen() + calcUpg.has(31) + countsFromMsgUpg
        let baseCpm = this.baseCpm()
        let goal = this.goal()
        if(baseCpm * calcMember.redPower() * (calcUpg.has(32) ? counts * 3 : 1) >= goal) {
            return 1
        }
        let greenRoleCount = !calcUpg.has(31)
        let noUpg9Count =
         data["channel-g1"] ? 1 : (data["msg-upg8"] && !data["msg-upg9"]) || (!data["msg-upg8"] && data["msg-upg9"])
        let cpmem = (counts * baseCpm * this.redPower() + greenRoleCount * baseCpm + noUpg9Count * this.baseCpm(false)) * 3
        let membersNeeded = Math.ceil(goal / cpmem)
        return Math.max(membersNeeded, 2)
    },
    isRed() {
        return !data["channel-g3"] && (data["general-role"] == "red" || calcUpg.has(31))
    },
    redPower() {
        let power = 3
        if(calcUpg.has(45))power *= 3
        return power
    },
    isBlue() {
        return !data["channel-g3"] && (data["general-role"] == "blue" || calcUpg.has(31))
    },
    isGreen() {
        return !data["channel-g3"] && (data["general-role"] == "green" || calcUpg.has(31))
    }
}

const calcThread = {
    parseLetterNotation(str) {
        return str.split("").reverse().map((char, index) => (char.charCodeAt() - 64) * 26 ** index).reduce((p, c) => p + c, 0)
    },
    convertLetterNotation(num) {
        if(num < 1 || !Number.isFinite(num))return ""
        let arr = []
        do {
            num -= 1
            let mod = num % 26
            num = Math.round((num - mod) / 26)
            arr.push(mod + 65)
        }while(num > 0)
        return String.fromCodePoint(...arr.reverse())
    },
    memberBoost() {
        if(data["channel-g4"])return 1
        return ([1, 3, 15, 200, 4000])[data["thread-completions"]]
    },
    upgBoost() {
        if(data["channel-g4"])return 1
        return Math.max(3 ** (data["thread-completions"] - 1), 1)
    },
    baseCpm() {
        let cpm = 1
        cpm *= 2 ** data["thread-coins-upg1"]
        cpm *= 2 ** data["thread-candy-caupg2"]
        cpm *= this.capacitors.pos()
        cpm *= calcUpg.threadBoost()
        if(data["channel-i1"])cpm *= 100
        if(data["channel-i2"])cpm *= 100
        if(data["channel-i3"])cpm *= 100
        if(data["channel-g3"])cpm *= 10
        return cpm
    },
    cpm() {
        let cpm = this.baseCpm()
        if(calcMember.isRed())cpm *= calcMember.redPower()
        return cpm
    },
    coins: {
        baseCopm() {
            let copm = 1
            copm *= 4 ** data["thread-coins-upg3"]
            copm *= 2 ** data["thread-candy-caupg1"]
            copm *= calcThread.capacitors.neg()
            copm *= calcUpg.threadBoost()
            if(data["channel-i3"])copm *= 10
            return copm
        },
        copm() {
            let copm = this.baseCopm()
            if(calcUpg.has(44) && calcMember.isRed())copm *= calcMember.redPower()
            return copm
        }
    },
    candy: {
        player: {
            atk() {
                let atk = 2 ** data["thread-candy-coupg1"]
                atk *= calcThread.capacitors.neutral()
                if(calcUpg.has(43))atk *= 4
                if(calcUpg.has(54))atk *= 6
                if(data["channel-g3"])atk *= 250
                return atk
            },
            hp() {
                let hp = 10 * 4 ** data["thread-candy-coupg2"]
                if(calcUpg.has(53))hp = Infinity
                return hp
            },
            def() {
                let def = 2 ** data["thread-candy-coupg3"]
                return def
            }
        },
        enemy: {
            atk() {
                let atk = 4 ** data["thread-candy-defeated"]
                if(calcUpg.has(53))atk = 0
                return atk
            },
            hp() {
                return 20 * 3 ** data["thread-candy-defeated"]
            },
            def() {
                let def = 2 ** data["thread-candy-defeated"]
                if(calcUpg.has(52))def /= 4
                return def
            }
        },
        attacksToKill() {
            let player = Math.ceil(data["thread-candy-player-hp"] / Math.round(this.enemy.atk() / this.player.def()))
            if(this.player.def() > this.enemy.atk())player = Infinity
            let enemy = Math.ceil(data["thread-candy-enemy-hp"] / Math.round(this.player.atk() / this.enemy.def()))
            if(this.enemy.def() > this.player.atk())enemy = Infinity
            if(!Number.isFinite(enemy))return Infinity
            if(player <= enemy)return Infinity
            return Math.ceil(enemy)
        },
        countsToKill() {
            return this.attacksToKill() * 10
        },
        total() {
            let candy = (3 ** data["thread-candy-defeated"] - 1) / 2
            if(calcUpg.has(51))candy *= 8
            return candy
        },
        spent() {
            let upg1 = (6 ** data["thread-candy-caupg1"] - 1) / 5
            let upg2 = (5 ** data["thread-candy-caupg2"] - 1) * 2.5
            return upg1 + upg2
        }
    },
    capacitors: {
        pos() {
            return 4 ** data["thread-capacitors-pos"]
        },
        neutral() {
            return 3 ** data["thread-capacitors-neutral"]
        },
        neg() {
            return 5 ** data["thread-capacitors-neg"]
        }
    }
}

/*
    upgrades implemented
    # = true
    - = false
    / = partially
      = not supported (does nothing)
    ? = idk

      1 2 3 4 5
    1 # # # # #
    2 # # # # #
    3   # # # #
    4     # # #
    5   # # # #
*/
const calcUpg = {
    baseCpm() {
        let cpm = calcThread.upgBoost()
        if(data["upg-has33"])cpm *= 2
        if(data["upg-has22"])cpm *= 3
        if(data["upg-has11"])cpm *= 10
        if(data["upg-has55"])cpm *= 10
        if(data["upg-has34"] && !data["channel-g1"])cpm *= calcMsgs.uc.upgAmt() + 1
        if(data["upg-has25"] && !data["channel-g2"])cpm *= data["time-slots"] + 1
        if(!data["channel-g1"])cpm *= 2 ** data["msg-buyable1"]
        cpm *= calcChannel.upgBoost()
        if(data["channel-g1"])cpm *= 100
        if(data["channel-g3"])cpm *= 10
        cpm = Math.round(cpm / 5 ** data["upg-cursed"])
        return cpm
    },
    roleBoost() {
        let mult = 1
        if(data["upg-has42"] && calcMember.isGreen())mult *= 5
        return mult
    },
    threadBoost() {
        return Math.round(Math.sqrt(306 / Math.max(data["upg-least"], 0.5)))
    },
    cpm() {
        return this.baseCpm() * this.roleBoost()
    },
    upgCost(id) {
        if(id == 13 || id == 31 || id == 35 || id == 53)return 5
        let div10 = Math.floor(id / 10)
        let mod10 = id % 10
        if(div10 == 1 || div10 == 5 || mod10 == 1 || mod10 == 5)return 2
        return 1
    },
    sumUpgCosts() {
        let sum = 0
        for(let x = 0; x < 5; x++) {
            for(let y = 0; y < 5; y++) {
                if(data[`upg-has${x + 1}${y + 1}`]) {
                    sum += this.upgCost(x * 10 + y + 11)
                }
            }
        }
        return sum
    },
    upgAmt() {
        let amt = calcMsgs.uc.adjustedUpgAmt()
        for(let x = 1; x <= 5; x++) {
            for(let y = 1; y <= 5; y++) {
                amt += data[`upg-has${x}${y}`]
            }
        }
        amt = Math.max(amt - 2 * data["upg-cursed"], 0)
        return amt
    },
    has(id) {
        return data["upg-has" + id] && !data["channel-g5"]
    }
}

const calcChannel = {
    numAnnihilated() {
        return data["channel-i1"] + data["channel-i2"] + data["channel-i3"] + data["channel-i4"] + 
        data["channel-g1"] + data["channel-g2"] + data["channel-g3"] +
        data["channel-g4"] + data["channel-g5"] + data["channel-g6"]
    },
    upgBoost() {
        return 2 ** this.numAnnihilated()
    },
    baseCpm() {
        let cpm = 1
        if(data["channel-i1"])cpm *= 10
        if(data["channel-i3"])cpm *= 200
        if(data["channel-g2"])cpm *= 20
        return cpm
    },
    cpm() {
        return this.baseCpm()
    },
    counts() {
        if(data["channel-i2"])return calcGeneral.maxCounts() - calcMember.isGreen()
        return 1
    }
}