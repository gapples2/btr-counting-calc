function multGTZ(num, mult) {
    if(mult > 0)return num * mult
    return num
}

const calcGeneral = {
    expFormat(num, p=data["general-sigfig"]-1) {
        if(!Number.isFinite(num))return "Infinity"
        if(num < 1000)return (Math.floor(num * 10 ** p) / 10 ** p).toFixed(0)
        let e = Math.floor(Math.log10(num))
        let m = num / 10 ** e
        p = Math.min(p, e)
        m = Math.floor(m * 10 ** p) / 10 ** p
        m = m.toFixed(p).replace(/0+$/,"")
        if(m.endsWith("."))m = m.slice(0, -1)
        return m + "e" + e.toFixed(0)
    },
    formatWhole(num) {
        if(num < 1e9)return num.toLocaleString("en-US", {maximumFractionDigits: 0})
        return this.expFormat(num)
    },
    expNumber(num, p=data["general-sigfig"]-1) {
        return Number(this.expFormat(num, p))
    }
}

const calcMsgs = {
    upgBoost() {
        let mult = 1
        if(data["msg-upg1"])mult *= 2
        if(data["msg-upg2"])mult *= Object.entries(realData).filter(arr => arr[0].startsWith("msg-upg") && arr[1] === true).length + 1
        if(data["msg-upg3"])mult *= 3
        if(data["msg-upg6"])mult /= 2
        if(data["msg-upg7"])mult *= 50
        return mult
    },
    cpm() {
        let base = Math.sqrt(800) ** (data["msg-completions"] + 1) / Math.sqrt(data["msg-least"])
        base *= this.upgBoost()
        base *= calcTime.msgBoost()
        if(data["msg-upg6"])base **= 1.1
        return Math.round(base)
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
        let msgs = this.expectedMsgs(Number(cpm) * (data["msg-red"] + 1))
        if(!Number.isFinite(Number(cpm)) || !Number.isFinite(msgs))return;
        if(data["msg-red"] == 1 && (msgs % 2) == 0 && Number(cpm) * (msgs - 2) * 2 + Number(cpm) * 3 >= this.goal())msgs--
        if(arr.length > 0 && arr.at(-1)[1] <= msgs)return;
        arr.push([cpm, msgs])
        data["msg-least"] = msgs
        this.msgChainRecursion(arr)
    }
}

const calcTime = {
    msgBoost() {
        return Math.sqrt(800 / data["time-least"]) * Math.sqrt(1600) ** data["time-factor"]
    },
    memberBoost() {
        return Math.sqrt(data["time-zen"] / 1000)
    },
    cpm() {
        let cpm = calcMember.timeBoost()
        if(data["msg-upg4"])cpm *= Math.round(calcMsgs.upgBoost() ** 0.75)
        if(data["msg-upg5"])cpm *= 3
        cpm *= 3 ** data["thread-coins-upg2"]
        if(data["general-red"])cpm *= 3
        return cpm
    }
}

const calcMember = {
    timeBoost() {
        return Math.round(Math.sqrt(32) ** (data["member-completions"] + 1) / Math.sqrt(data["member-least"]))
    },
    cpm() {
        let cpm = calcTime.memberBoost()
        if(data["msg-upg9"])cpm *= 10
        cpm *= ([1, 3, 15, 200, 4000])[data["thread-completions"]]
        cpm = Math.round(cpm)
        if(data["general-red"])cpm *= 3
        return cpm
    },
    goal() {
        return 24 * 100 ** data["member-completions"]
    },
    estimatedMembersNoMinmax() {
        let originalRed = data["general-red"]
        data["general-red"] = true
        let cpm = this.cpm()
        data["general-red"] = originalRed
        let goal = this.goal()
        if(data["msg-upg8"] && data["msg-upg9"])return Math.ceil(goal / (cpm * 6))
        return Math.ceil(goal / (cpm * 3))
    },
    estimatedMembers() {
        if(!data["member-minmax"])return this.estimatedMembersNoMinmax()
        let originalRed = data["general-red"]
        data["general-red"] = true
        let rcpm = this.cpm()
        let goal = this.goal()
        if(rcpm >= goal) {
            data["general-red"] = originalRed
            return 1
        }
        data["general-red"] = false
        let gcpm = this.cpm()
        let originalUpg9 = data["msg-upg9"]
        data["msg-upg9"] = false
        let lowcpm = this.cpm()
        data["msg-upg9"] = originalUpg9
        data["general-red"] = originalRed
        let cpm = 0
        if(data["msg-upg8"] && data["msg-upg9"]) {
            // 6 counts with red role, 3 counts with green role
            cpm = rcpm * 6 + gcpm * 3
        }else if(data["msg-upg8"] || data["msg-upg9"]){
            // 3 counts with red role, 3 counts with green role, 3 counts with green role and upg 8
            cpm = rcpm * 3 + gcpm * 3 + lowcpm * 3
        }else{
            // 3 counts with red role, 3 counts with green role
            cpm = rcpm * 3 + gcpm * 3
        }
        return Math.ceil(goal / cpm)
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
    cpm() {
        let cpm = 1
        cpm *= 2 ** data["thread-coins-upg1"]
        cpm *= 2 ** data["thread-candy-caupg2"]
        cpm *= this.capacitors.pos()
        if(data["general-red"])cpm *= 3
        return cpm
    },
    coins: {
        copm() {
            let copm = 1
            copm *= 4 ** data["thread-coins-upg3"]
            copm *= 2 ** data["thread-candy-caupg1"]
            copm *= calcThread.capacitors.neg()
            return copm
        }
    },
    candy: {
        player: {
            atk() {
                let atk = 2 ** data["thread-candy-coupg1"]
                atk *= calcThread.capacitors.neutral()
                return atk
            },
            hp() {
                let hp = 10 * 4 ** data["thread-candy-coupg2"]
                return hp
            },
            def() {
                let def = 2 ** data["thread-candy-coupg3"]
                return def
            }
        },
        enemy: {
            atk() {
                return 4 ** data["thread-candy-defeated"]
            },
            hp() {
                return 20 * 3 ** data["thread-candy-defeated"]
            },
            def() {
                return 2 ** data["thread-candy-defeated"]
            }
        },
        attacksToKill() {
            let player = data["thread-candy-player-hp"] / Math.round(this.enemy.atk() / this.player.def())
            if(this.player.def() > this.enemy.atk())player = Infinity
            let enemy = data["thread-candy-enemy-hp"] / Math.round(this.player.atk() / this.enemy.def())
            if(this.enemy.def() > this.player.atk())enemy = Infinity
            if(!Number.isFinite(enemy))return Infinity
            if(player <= enemy)return Infinity
            return Math.ceil(enemy)
        },
        countsToKill() {
            return this.attacksToKill() * 10
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