function multGTZ(num, mult) {
    if(mult > 0)return num * mult
    return num
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
    expFormat(num, p=2) {
        if(!Number.isFinite(num))return "Infinity"
        if(num < 1000)return (Math.floor(num * 10 ** p) / 10 ** p).toFixed(0)
        let e = Math.floor(Math.log10(num))
        let m = num / 10 ** e
        p = Math.min(p, e)
        m = Math.floor(m * 10 ** p) / 10 ** p
        return m.toFixed(p).replace(/0+$/,"") + "e" + e.toFixed(0)
    },
    formatWhole(num) {
        if(num < 1e9)return num.toLocaleString("en-US", {maximumFractionDigits: 0})
        return this.expFormat(num)
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
        let cpm = this.expFormat(this.cpm(), data["msg-sigfig"] - 1)
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
    }
}

const calcThread = {
    parseLetterNotation(str) {
        return str.split("").reverse().map((char, index) => (char.charCodeAt() - 64) * 26 ** index).reduce((p, c) => p + c, 0)
    },
    convertLetterNotation(num) {
        // todo: make this not absolute garbage
        let len = num.toString(26).length - (/[01]+0/).test(num.toString(26))
        return (num-(26**len-1)/25).toString(26).split("").map(char => char.charCodeAt()).map(num => num < 60 ? num + 17 : num - 22).map(num => String.fromCharCode(num)).join("").padStart(len,"A")
    }
}