const saving = {
    key: "btr-counting-calc-save",
    save() {
        localStorage.setItem(this.key, JSON.stringify(realData))
    }, 
    load() {
        let save = localStorage.getItem(this.key)
        if(save === null)return;
        realData = JSON.parse(save)
    },
    replaceTest(arr, str) {
        for(let test of arr) {
            if(str.startsWith(test)) {
                return true
            }
        }
        return false
    },
    import() {
        // this one is not as simple as export
        // take bits out that i dont want
        let importStr = elements["save-import-input"].value
        if(importStr.length == 0)return;
        let importData = {}
        try {
            importData = JSON.parse(LZString.decompressFromBase64(importStr))
        }catch(e) {
            return e
        }
        if(importData.replace === undefined || importData.data === undefined)return;
        // its probably real data
        // first remove the data thats going to be replaced
        realData = Object.fromEntries(Object.entries(realData).filter(arr => {
            let id = arr[0]
            return !saving.replaceTest(importData.replace, id)
        }))
        // then add the new data
        Object.entries(importData.data).forEach(arr => {
            let id = arr[0]
            let val = arr[1]
            realData[id] = val
        })
        // now save and reload
        this.save()
        window.location.reload()
    },
    export() {
        // this one should be pretty simple
        // just organize the data into 1 big object
        let categoryArr = ["general", "msg", "time", "member", "thread", "upg", "count-help"]
        categoryArr = categoryArr.filter(id => data["save-export-" + id])
        let exportData = {replace: categoryArr, data: {}}
        exportData.data = Object.fromEntries(Object.entries(realData).filter(arr => {
            let id = arr[0]
            return saving.replaceTest(categoryArr, id) && !id.endsWith("hide")
        }))
        let exportStr = LZString.compressToBase64(JSON.stringify(exportData))
        window.navigator.clipboard.writeText(exportStr)
    }
}