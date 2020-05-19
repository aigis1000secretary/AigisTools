const styleUnChecked = "opacity:0.4;";
const styleChecked = "opacity:1.0;";
const styleSize = "50";

// url parameter method
function _atob(base32Str) {
    let base2Str = "";
    while (base32Str.length > 0) {
        let temp = base32Str.substr(0, 1);
        base32Str = base32Str.substr(1);
        base2Str += parseInt(temp, 32).toString(2).padStart(5, "0");
    }
    return base2Str;
}

function _btoa(base2Str) {
    let base32Str = "";
    while (base2Str.length > 0) {
        let temp = base2Str.substr(0, 5);
        base2Str = base2Str.substr(5);
        base32Str += parseInt(temp, 2).toString(32);
    }
    return base32Str;
}

function getUrlFlags() {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // get url data
    let urlData = params.get("data");

    // sharebox
    if (urlData && urlData.replace(/0/g, "") != "") {
        let sharebox = document.getElementById("sharebox");
        sharebox.textContent = url;
    } else { sharebox.textContent = "ここに共有する内容が表示されます" }

    // return flag list
    return urlData ? _atob(urlData) : "";
}

function setUrlFlags(flagList) {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // make url data from flag list
    let urlData = _btoa(flagList);

    // set data to url
    params.set("data", urlData);
    history.pushState(null, null, url);

    // sharebox
    if (urlData.replace(/0/g, "") != "") {
        let sharebox = document.getElementById("sharebox");
        sharebox.textContent = url;
    } else { sharebox.textContent = "ここに共有する内容が表示されます" }
}

function getIconFlags() {
    // read flag from iconbox
    let l = Math.ceil(maxCid / 5) * 5;
    let flagArray = new Array(l).fill("0");
    let maxIndex = 0;
    let iconList = document.getElementById("iconbox").getElementsByClassName("icon");
    for (let i in iconList) {
        let icon = iconList[i];
        let id = icon.id;
        let flag = (icon.alt == "true") ? "1" : "0";
        flagArray[id] = flag;
        if (!isNaN(id)) {
            maxIndex = Math.max(id, maxIndex);
        }
    }

    // make flag list
    return flagArray.join(""); // .replace(/$0*/, "")
}

function setIconFlags(flagList) {
    // make flag list
    let flagArray = flagList.split("");

    // set flag to iconbox
    let iconbox = document.getElementById("iconbox");
    for (let i in iconbox.children) {
        let icon = iconbox.children[i];
        let id = icon.id;
        let flag = (flagArray[id] && flagArray[id] == "1") ? "true" : "false";

        icon.alt = flag;
        icon.style = icon.alt == "true" ? styleChecked : styleUnChecked;
    }
};

// init method
function init() {
    let iconbox = document.getElementById("iconbox");

    for (let i in charaData) {
        if (charaData[i] == null) continue;

        let icon = document.createElement("img");
        icon.className = "icon";
        icon.id = charaData[i].id;
        icon.title = charaData[i].name;
        icon.src = charaData[i].img;
        icon.width = styleSize;
        icon.height = styleSize;

        icon.alt = "false";
        icon.style = icon.alt == "true" ? styleChecked : styleUnChecked;
        icon.addEventListener("click", function(e) {
            this.alt = this.alt == "true" ? "false" : "true";
            this.style = this.alt == "true" ? styleChecked : styleUnChecked;
            // set url data
            flagList = getIconFlags();
            setUrlFlags(flagList);
        }, false);
        iconbox.appendChild(icon);
    }
    // read url data
    flagList = getUrlFlags()
    setIconFlags(flagList)
}

// hr method
function setHr(type) {
    let iconbox = document.getElementById("iconbox");
    bFlag = false;
    for (let i = 0; i < iconbox.childElementCount; ++i) {
        let a = iconbox.children[i];
        let b = iconbox.children[i + 1];
        if (!a || !b || a.tagName != "IMG" || b.tagName != "IMG") continue;

        let aData = charaData.find(obj => obj && obj.id == a.id);
        let bData = charaData.find(obj => obj && obj.id == b.id);
        if (!aData || !bData) continue;

        if (type == "rare") {
            if ((aData.rare != bData.rare) || (aData.placeType != bData.placeType)) {
                let br = document.createElement("hr");
                a.parentNode.insertBefore(br, b);
            }
        } else if (type == "class") {
            if (aData.placeType != bData.placeType) {
                let br = document.createElement("hr");
                a.parentNode.insertBefore(br, b);
            }
        } else if (aData[type] != undefined && bData[type] != undefined && (aData[type] != bData[type])) {
            let br = document.createElement("hr");
            a.parentNode.insertBefore(br, b);
        }
    }
};

// sort method
function sortByDate(ascending) {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by id
        if (a.id != b.id) return (!!ascending == (a.id < b.id)) ? -1 : 1;

        return 0;
    })

    init();
};

function sortByRare(ascending) {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by rare
        if (a.rare != b.rare) return (!!ascending == (a.rare < b.rare)) ? -1 : 1;

        // sort by group
        if (a.sortGroupID != b.sortGroupID) return (a.sortGroupID < b.sortGroupID) ? -1 : 1;

        // sort by class
        if (a.classId != b.classId) return (a.classId < b.classId) ? -1 : 1;

        // sort by id
        if (a.id != b.id) return (a.id < b.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("rare");
};

function sortByClass(ascending) {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by placeType
        if (a.placeType != b.placeType) return (a.placeType < b.placeType) ? -1 : 1;

        // sort by class
        if (a.classId != b.classId) return (!!ascending == (a.classId < b.classId)) ? -1 : 1;

        // sort by rare
        if (a.rare != b.rare) return (a.rare > b.rare) ? -1 : 1;

        // sort by group
        if (a.sortGroupID != b.sortGroupID) return (a.sortGroupID < b.sortGroupID) ? -1 : 1;

        // sort by id
        if (a.id != b.id) return (a.id < b.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("class");
};

function sortByKind() {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by kind
        if (a.kind != b.kind) return (a.kind < b.kind) ? -1 : 1;

        return 0;
    })

    init();
    setHr("kind");
};

function sortByEvent() {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by isEvent
        if (a.isEvent != b.isEvent) return (a.isEvent > b.isEvent) ? -1 : 1;

        return 0;
    })

    init();
    setHr("isEvent");
};

function sortByAssign() {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by assign
        if (a.assign != b.assign) return (a.assign < b.assign) ? -1 : 1;

        return 0;
    })

    init();
    setHr("assign");
};

function sortByGenus() {
    $(".iconbox").empty();

    charaData.sort(function compare(a, b) {
        // sort by isEvent
        if (a.genus != b.genus) return (a.genus > b.genus) ? -1 : 1;

        return 0;
    })

    init();
    setHr("genus");
};

// selector
function filter(checkbox) {
    // get backup
    let flagList = getIconFlags();

    let key = checkbox.name;
    let value = checkbox.alt;

    for (let i in charaData) {
        let obj = charaData[i];

        if (obj[key] == undefined) break; // continue;    // ?
        if (obj[key] != value) continue;

        let icon = document.getElementById(obj.id);
        icon.alt = checkbox.checked ? "false" : "true";
        icon.style = icon.alt == "true" ? styleChecked : styleUnChecked;
    }


    // set url data
    let newList = getIconFlags();
    setUrlFlags(newList);
    // backup
    if (newList != flagList) {
        urlHistory.push(flagList);
    }
};
// undo method
let urlHistory = [];

function undo() {
    let flagList = urlHistory.pop();
    if (!flagList) return;
    setUrlFlags(flagList);
    setIconFlags(flagList);
};

// html result to image
function openImage() {
    html2canvas(document.getElementById("iconbox")).then(function(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        window.open().document.write('<img src="' + image.src + '" />');
    });
}