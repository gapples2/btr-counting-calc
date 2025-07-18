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
        if(data['msg-upg8'])counts++
        if(calcMember.isGreen())counts++
        if(data["upg-has21"])counts += 2
        return counts
    }
}

const calcMsgs = {
    upgCosts: [1, 1, 3, 3, 5, 6, 9, 16, 23],
    getUpgs() {
        return Object.entries(realData).filter(arr => arr[0].startsWith("msg-upg") && arr[1] === true)
    },
    sumUpgCost() {
        return this.getUpgs().reduce((p, c) => p + this.upgCosts[Number(c[0].slice(7)) - 1], 0)
    },
    upgAmt() {
        return this.getUpgs().length
    },
    upgBoost() {
        let mult = 1
        if(data["msg-upg1"])mult *= 2
        if(data["msg-upg2"])mult *= this.upgAmt() + 1
        if(data["msg-upg3"])mult *= 3
        if(data["msg-upg6"])mult /= 2
        if(data["msg-upg7"])mult *= 50
        return mult
    },
    baseCpm() {
        let base = Math.sqrt(800) ** (data["msg-completions"] + 1) / Math.sqrt(data["msg-least"])
        base *= this.upgBoost()
        base *= calcTime.msgBoost()
        if(data["msg-upg6"])base **= 1.1
        return Math.round(base)
    },
    cpm() {
        let cpm = this.baseCpm()
        if(calcMember.isRed())cpm *= calcMember.redPower()
        return cpm
    },
    goal() {
        return 200 * 1000 ** data["msg-completions"]
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
        return data["time-c3"] + data["time-c2"] / 2 + data["time-c1"] / 4
    },
    challengeSum() {
        return data["time-c1"] + data["time-c2"] + data["time-c3"]
    },
    msgBoost() {
        return Math.sqrt(800 / data["time-least"]) * Math.sqrt(1600) ** data["time-factor"]
    },
    memberBoost() {
        let mult = Math.sqrt(data["time-zen"] / 1000)
        if(data["upg-has12"])mult **= 1.5
        return mult
    },
    baseCpm() {
        let cpm = calcMember.timeBoost()
        if(data["msg-upg4"])cpm *= Math.round(calcMsgs.upgBoost() ** 0.75)
        if(data["msg-upg5"])cpm *= 3
        cpm *= 3 ** data["thread-coins-upg2"]
        if(data["upg-has23"])cpm *= 3
        return cpm
    },
    roleBoost() {
        let mult = 1
        if(calcMember.isRed())mult *= calcMember.redPower()
        if(data["upg-has41"] && calcMember.isBlue())mult *= 5
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
        return Math.round(Math.sqrt(32) ** (data["member-completions"] + 1) / Math.sqrt(data["member-least"]))
    },
    baseCpm(upg9=data["msg-upg9"]) {
        let cpm = calcTime.memberBoost()
        if(upg9)cpm *= 10
        cpm *= ([1, 3, 15, 200, 4000])[data["thread-completions"]]
        cpm = Math.round(cpm)
        return cpm
    },
    cpm() {
        let cpm = this.baseCpm()
        if(calcMember.isRed())cpm *= calcMember.redPower()
        return cpm
    },
    goal() {
        return 24 * 100 ** data["member-completions"]
    },
    estimatedMembersNoMinmax() {
        let counts = calcGeneral.maxCounts()
        let cpm = calcGeneral.expNumber(this.cpm())
        let goal = this.goal()
        if(cpm * (data["upg-has32"] ? counts : 1) >= goal) {
            return 1
        }
        let countsNeeded = Math.ceil(goal / cpm)
        let membersNeeded = Math.ceil(countsNeeded / (counts * 3))
        return Math.max(membersNeeded, 2)
    },
    estimatedMembers() {
        if(!data["member-minmax"])return this.estimatedMembersNoMinmax()
        let counts = calcGeneral.maxCounts() - this.isGreen() + data["upg-has31"]
            - data["msg-upg8"] + (data["msg-upg8"] && data["msg-upg9"])
        let baseCpm = this.baseCpm()
        let goal = this.goal()
        if(baseCpm * calcMember.redPower() * (data["upg-has32"] ? counts : 1) >= goal) {
            return 1
        }
        let greenRoleCount = !data["upg-has31"]
        let noUpg9Count = (data["msg-upg8"] && !data["msg-upg9"]) || (!data["msg-upg8"] && data["msg-upg9"])
        let cpmem = (counts * baseCpm * this.redPower() + greenRoleCount * baseCpm + noUpg9Count * this.baseCpm(false)) * 3
        let membersNeeded = Math.ceil(goal / cpmem)
        return Math.max(membersNeeded, 2)
    },
    isRed() {
        return data["general-role"] == "red" || data["upg-has31"]
    },
    redPower() {
        let power = 3
        if(data["upg-has45"])power *= 3
        return power
    },
    isBlue() {
        return data["general-role"] == "blue" || data["upg-has31"]
    },
    isGreen() {
        return data["general-role"] == "green" || data["upg-has31"]
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
    baseCpm() {
        let cpm = 1
        cpm *= 2 ** data["thread-coins-upg1"]
        cpm *= 2 ** data["thread-candy-caupg2"]
        cpm *= this.capacitors.pos()
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
            return copm
        },
        copm() {
            let copm = this.baseCopm()
            if(data["upg-has44"] && calcMember.isRed())copm *= calcMember.redPower()
            return copm
        }
    },
    candy: {
        player: {
            atk() {
                let atk = 2 ** data["thread-candy-coupg1"]
                atk *= calcThread.capacitors.neutral()
                if(data["upg-has43"])atk *= 4
                if(data["upg-has54"])atk *= 6
                return atk
            },
            hp() {
                let hp = 10 * 4 ** data["thread-candy-coupg2"]
                if(data["upg-has53"])hp = Infinity
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
                if(data["upg-has53"])atk = 0
                return atk
            },
            hp() {
                return 20 * 3 ** data["thread-candy-defeated"]
            },
            def() {
                let def = 2 ** data["thread-candy-defeated"]
                if(data["upg-has52"])def /= 4
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
            if(data["upg-has51"])candy *= 8
            return candy
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
    1 # # # # /
    2 # # # # #
    3   # # # #
    4 ?   # # #
    5   # ? # #
*/
const calcUpg = {
    baseCpm() {
        let cpm = 1
        if(data["upg-has33"])cpm *= 2
        if(data["upg-has22"])cpm *= 3
        if(data["upg-has11"])cpm *= 10
        if(data["upg-has55"])cpm *= 10
        if(data["upg-has34"])cpm *= calcMsgs.upgAmt() + 1
        if(data["upg-has25"])cpm *= calcTime.challengeSum() + 1
        return cpm
    },
    roleBoost() {
        let mult = 1
        if(data["upg-has42"] && calcMember.isGreen())mult *= 5
        return mult
    },
    cpm() {
        return this.baseCpm() * this.roleBoost()
    }
}