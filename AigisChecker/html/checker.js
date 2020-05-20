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

function getUrlParams() {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // get url data
    let urlData = params.get("data");

    // return flag list
    return urlData ? _atob(urlData) : "";
}

function setUrlParams(flagList) {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // make url data from flag list
    let urlData = _btoa(flagList);

    // set data to url
    if (urlData.replace(/0/g, "") != "") { params.set("data", urlData); } else { params.delete("data"); }
    params.set("sortBy", sortMode);

    history.pushState(null, null, url);

    // sharebox
    let shareText = "【千年戦争アイギス】ユニット所持チェッカー＋\n"
    shareText += doStatistics() + "\n";
    shareText += url;
    shareText += "\n #アイギス所持チェッカー \n #千年戦争アイギス ";

    document.getElementById("_sharebox").textContent = shareText;
    setShareButton(shareText);
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
        if (icon.tagName != "IMG") continue;
        let id = icon.id;
        let flag = (flagArray[id] && flagArray[id] == "1") ? "true" : "false";

        icon.alt = flag;
        icon.style = icon.alt == "true" ? styleChecked : styleUnChecked;
    }
}

// body onload method
function bodyOnload() {

    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // get url data
    let sortBy = params.get("sortBy") || "";

    // sharebox
    switch (sortBy.toLowerCase()) {
        case "date":
            sortByDate(sortBy[0] == sortBy[0].toUpperCase());
            break;

        case "rare":
            sortByRare(sortBy[0] == sortBy[0].toUpperCase());
            break;

        case "class":
            sortByClass(sortBy[0] == sortBy[0].toUpperCase());
            break;

        case "kind":
            sortByKind();
            break;

        case "isevent":
            sortByEvent();
            break;

        case "assign":
            sortByAssign();
            break;

        case "genus":
            sortByGenus();
            break;

        case "yeargacha":
            sortByYearGacha();
            break;

        default:
            sortByRare(false);
            break;
    }
}

// init method
function init() {
    let iconbox = document.getElementById("iconbox");

    for (let i in charaData) {
        if (charaData[i] == null) continue;

        // build dom element
        let icon = document.createElement("img");
        icon.className = "icon";
        icon.id = charaData[i].id;
        icon.title = charaData[i].name;
        icon.src = charaData[i].img;
        icon.width = styleSize;
        icon.height = styleSize;

        icon.alt = "false";
        icon.style = icon.alt == "true" ? styleChecked : styleUnChecked;

        // onclick event
        icon.addEventListener("click", function(e) {
            this.alt = this.alt == "true" ? "false" : "true";
            this.style = this.alt == "true" ? styleChecked : styleUnChecked;
            // set url data
            setUrlParams(getIconFlags());
        }, false);

        // append
        iconbox.appendChild(icon);
    }
    // read url data
    setIconFlags(getUrlParams());
}

// hr method
function setHr(type) {
    // get icon list
    let iconbox = document.getElementById("iconbox");
    let hidden = false;

    // set hr
    for (let i = 0; i < iconbox.childElementCount; ++i) {
        // get image & id
        let a = iconbox.children[i];
        let b = iconbox.children[i + 1];
        if (!a || !b || a.tagName != "IMG" || b.tagName != "IMG") continue;
        if (hidden) {
            a.hidden = true;
            b.hidden = true;
        }

        // get icon data
        let aData = charaData.find(obj => obj && obj.id == a.id);
        let bData = charaData.find(obj => obj && obj.id == b.id);
        if (!aData || !bData) continue;

        // set text
        let aText = "";
        let bText = "";

        if (type == "year") {
            aText = aData.year + "年";
            bText = bData.year + "年";

        } else if (type == "rare") {
            let textList = ["", "", "シルバー", "ゴールド", "プラチナ", "ブラック"];
            aText = aData.rare == 3.5 ? "サファイア" : textList[parseInt(aData.rare)];
            bText = bData.rare == 3.5 ? "サファイア" : textList[parseInt(bData.rare)];

            if (aData.rare * 10 % 10 == 1) aText += "英傑";
            if (bData.rare * 10 % 10 == 1) bText += "英傑";

            textList = ["", "近接", "遠隔", "両用"];
            aText += " " + textList[aData.placeType];
            bText += " " + textList[bData.placeType];

            if (aData.rare * 10 % 10 == 2) aText = "王子";
            if (bData.rare * 10 % 10 == 2) bText = "王子";

        } else if (type == "classId") {
            let textList = ["", "近接", "遠隔", "両用"];
            aText = textList[aData.placeType];
            bText = textList[bData.placeType];

        } else if (type == "kind") {
            let textList = ["男性", "女性"];
            aText = textList[aData.kind];
            bText = textList[bData.kind];

        } else if (type == "isEvent") {
            let textList = ["ガチャ", "イベント"];
            aText = textList[aData.isEvent];
            bText = textList[bData.isEvent];

        } else if (type == "assign") {
            let textList = [];
            textList[-5] = "流星ワールドアクター（流星WA）";
            textList[-4] = "ガールズ・ブック・メイカー（GBM）";
            textList[-3] = "封緘のグラセスタ（封緘）";
            textList[-2] = "真・恋姫†夢想 - 革命（恋姫）";
            textList[-1] = "ランス10-決戦-";
            textList[0] = "王国";
            textList[2] = "白の帝国";
            textList[3] = "アルスラーン戦記（遠国）";
            textList[5] = "砂漠の国";
            textList[6] = "七つの大罪（異郷）";
            textList[8] = "東の国";

            aText += textList[aData.assign];
            bText += textList[bData.assign];

        } else if (type == "genus") {
            let textList = [];
            textList[0] = "通常";
            textList[101] = "お正月";
            textList[102] = "バレンタイン";
            textList[103] = "学園";
            textList[104] = "ジューンブライド";
            textList[105] = "サマー";
            textList[106] = "ハロウィン";
            textList[107] = "聖夜";
            textList[108] = "ちび";
            textList[109] = "温泉";

            aText = textList[aData.genus];
            bText = textList[bData.genus];

            if (bData.genus == 0) hidden = true;

        } else if (type == "yearGacha") {
            let aBool, bBool;
            aBool = (aData.isEvent == 0 && 5.0 <= aData.rare && aData.rare < 5.2) ? 1 : 0;
            bBool = (bData.isEvent == 0 && 5.0 <= bData.rare && bData.rare < 5.2) ? 1 : 0;
            if (aBool) aText += "ガチャ ブラック "
            if (bBool) bText += "ガチャ ブラック "

            let al = [0, 5, 8];
            aBool = (al.find(i => i == aData.assign) != undefined) && aData.genus == 0 && aData.rare * 10 % 10 == 0;
            bBool = (al.find(i => i == bData.assign) != undefined) && bData.genus == 0 && bData.rare * 10 % 10 == 0;
            if (!aBool) aText = "限定" + aText;
            if (!bBool) bText = "限定" + bText;

            aText = aData.year + "年 " + aText;
            bText = bData.year + "年 " + bText;

            if (!bBool) hidden = true;

        }

        // set hr or not
        let hr = document.createElement("div");
        hr.className = "hr";
        if (i == 0) {
            hr.innerHTML = `<span>${aText}</span>`;
            a.parentNode.insertBefore(hr, a);
        } else if (aText != bText && !hidden) {
            hr.innerHTML = `<span>${bText}</span>`;
            a.parentNode.insertBefore(hr, b);
        }
    }

    doStatistics();

    // set sort mode to url
    setUrlParams(getIconFlags());
}

// sort method
let sortMode = "";

function sortByDate(ascending) {
    sortMode = ascending ? "DATE" : "date";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by id
        if (aData.id != bData.id) return (!!ascending == (aData.id < bData.id)) ? -1 : 1;

        return 0;
    })

    init();
    setHr("year");
}

function sortByRare(ascending) {
    sortMode = ascending ? "RARE" : "rare";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by rare
        if (aData.rare != bData.rare) return (!!ascending == (aData.rare < bData.rare)) ? -1 : 1;

        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;

        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;

        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("rare");
}

function sortByClass(ascending) {
    sortMode = ascending ? "CLASS" : "class";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by placeType
        if (aData.placeType != bData.placeType) return (aData.placeType < bData.placeType) ? -1 : 1;

        // sort by class
        if (aData.classId != bData.classId) return (!!ascending == (aData.classId < bData.classId)) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;

        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;

        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("classId");
}

function sortByKind() {
    sortMode = "kind";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by kind
        if (aData.kind != bData.kind) return (aData.kind < bData.kind) ? -1 : 1;

        return 0;
    })

    init();
    setHr("kind");
}

function sortByEvent() {
    sortMode = "isEvent";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by isEvent
        if (aData.isEvent != bData.isEvent) return (aData.isEvent > bData.isEvent) ? -1 : 1;

        return 0;
    })

    init();
    setHr("isEvent");
}

function sortByAssign() {
    sortMode = "assign";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by assign
        if (aData.assign == 0) return 1;
        if (bData.assign == 0) return -1;
        if (aData.assign != bData.assign) return (aData.assign < bData.assign) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;

        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;

        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("assign");
}

function sortByGenus() {
    sortMode = "genus";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by genus
        if (aData.genus == 0) return 1;
        if (bData.genus == 0) return -1;
        if (aData.genus != bData.genus) return (aData.genus < bData.genus) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;

        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;

        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("genus");
}

function sortByYearGacha() {
    sortMode = "yearGacha";
    $(".iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort rare
        let aBool, bBool;
        aBool = (aData.isEvent == 0 && 5.0 <= aData.rare && aData.rare < 5.2) ? 1 : 0;
        bBool = (bData.isEvent == 0 && 5.0 <= bData.rare && bData.rare < 5.2) ? 1 : 0;
        if (aBool != bBool) return aBool ? -1 : 1;

        // sort 限定
        let al = [0, 5, 8];
        aBool = (al.find(i => i == aData.assign) != undefined) && aData.genus == 0 && aData.rare * 10 % 10 == 0;
        bBool = (al.find(i => i == bData.assign) != undefined) && bData.genus == 0 && bData.rare * 10 % 10 == 0;
        if (aBool != bBool) return aBool ? -1 : 1;


        // sort by year
        if (aData.year != bData.year) return (aData.year < bData.year) ? -1 : 1;

        // // sort by placeType
        // if (aData.placeType != bData.placeType) return (aData.placeType < bData.placeType) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;

        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;

        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("yearGacha");
}

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
        icon.alt = checkbox.checked ? "true" : "false";
        icon.style = icon.alt == "true" ? styleChecked : styleUnChecked;
    }

    // set url data
    let newList = getIconFlags();
    setUrlParams(newList);
    // backup
    if (newList != flagList) {
        urlHistory.push(flagList);
    }
}
// undo method
let urlHistory = [];

function undo() {
    let flagList = urlHistory.pop();
    if (!flagList) return;
    setUrlParams(flagList);
    setIconFlags(flagList);
}

// html result to image
function openImage() {
    html2canvas(document.getElementById("Layout_Mainblock")).then(function(canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        window.open().document.write("<img src=\"" + image.src + "\" />");
    });
}

function copyUrl() {
    document.getElementById("_sharebox").select();
    document.execCommand("copy");
}

function setShareButton(currentUri) {
    document.getElementById("_twitterBtn").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(currentUri);
    document.getElementById("_lineBtn").href = "line://msg/text/" + encodeURIComponent(currentUri);
    document.getElementById("_plurkBtn").href = "https://plurk.com/?qualifier=shares&status=" + encodeURIComponent(currentUri);
}

function doStatistics() {

    let globalIconCount = 0;
    let globalTrueCount = 0;

    let iconCount = 0;
    let trueCount = 0;
    // set hr statistics text
    let icon, hrList = document.getElementById("iconbox").getElementsByClassName("hr");
    // get type count
    for (let i = 0; i < hrList.length; ++i) {
        icon = hrList[i];
        let label = icon.children[0].textContent;
        // get icon count
        while (true) {
            icon = icon.nextElementSibling;

            if (!icon || icon.tagName != "IMG") break;
            globalIconCount++;
            globalTrueCount += icon.alt == "true" ? 1 : 0;

            if (icon.hidden) break;
            iconCount++;
            trueCount += icon.alt == "true" ? 1 : 0;
        }
        // set text
        hrList[i].innerHTML = `<span>${label}</span>:　　${Math.floor(100 * trueCount / iconCount)} % （${trueCount}/${iconCount}）`;
        iconCount = 0;
        trueCount = 0;
    }
    return `所有率: ${Math.floor(100 * globalTrueCount / globalIconCount)} % （${globalTrueCount}/${globalIconCount}）`
}