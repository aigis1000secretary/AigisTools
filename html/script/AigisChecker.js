
// url parameter method
let _atob = function (base32Str) {
    let base2Str = "";
    while (base32Str.length > 0) {
        let temp = base32Str.substr(0, 1);
        base32Str = base32Str.substr(1);
        base2Str += parseInt(temp, 32).toString(2).padStart(5, "0");
    }
    return base2Str;
}
let _btoa = function (base2Str) {
    let base32Str = "";
    while (base2Str.length > 0) {
        let temp = base2Str.substr(0, 5);
        base2Str = base2Str.substr(5);
        base32Str += parseInt(temp, 2).toString(32);
    }
    return base32Str;
}

let getUrlParams = function () {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // get url data
    let urlData = params.get("data");

    // return flag list
    return urlData ? _atob(urlData) : "";
}
let setUrlParams = function (flagList) {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // make url data from flag list
    let urlData = _btoa(flagList);

    // set data to url
    if (!/^0+$/.test(urlData)) { params.set("data", urlData); } else { params.delete("data"); }
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

let getIconFlags = function () {
    // read flag from iconbox
    let l = Math.ceil(maxCid / 5) * 5;
    let flagArray = new Array(l).fill("0");
    let iconList = document.getElementById("iconbox").getElementsByClassName("iconbtn");
    for (let i in iconList) {
        let icon = iconList[i];
        let id = icon.id;
        let flag = (icon.alt == "true") ? "1" : "0";
        flagArray[id] = flag;
    }

    // make flag list
    return flagArray.join("");
}
let setIconFlags = function (flagList) {
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
    }
}

// body onload method
let bodyOnload = function () {
    // skip data
    let i = 0;
    while (i < charaData.length) {
        chara = charaData[i];
        if (!chara) { ++i; continue; }

        let skipList = [1];
        if (skipList.indexOf(chara.id) != -1 ||     // skip who not a unit
            chara.rare <= 1 ||                      // skip low rare
            chara.sortGroupID == 10 ||              // skip seirei
            chara.sortGroupID == 11 ||              // skip token
            chara.sortGroupID == 12                 // skip Non-R18 chara
        ) {
            // skip
            charaData.splice(i, 1);
            continue;
        }
        ++i;
    }

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
let init = function () {
    let iconbox = document.getElementById("iconbox");

    for (let i in charaData) {
        if (charaData[i] == null) continue;

        // build dom element
        let icon = document.createElement("img");
        icon.className = "iconbtn";
        icon.id = charaData[i].id;
        icon.title = charaData[i].name;
        icon.src = charaData[i].img;
        icon.alt = "false";
        icon.draggable = false;

        // onclick event
        icon.addEventListener("click", function (e) {
            this.alt = this.alt == "true" ? "false" : "true";
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
let setHr = function (type) {
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
            let textList = ["ガチャ", "イベント", "小説"];
            aText = textList[(aData.rare == 3.5) ? 2 : aData.isEvent];
            bText = textList[(bData.rare == 3.5) ? 2 : bData.isEvent];
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
        hr.hidden = hidden;
        if (i == 0) {
            hr.innerHTML = `<span>${aText}</span>`;
            a.parentNode.insertBefore(hr, a);
        } else if (aText != bText) {
            hr.innerHTML = `<span>${bText}</span>`;
            a.parentNode.insertBefore(hr, b);
        }
    }

    // set sort mode to url
    setUrlParams(getIconFlags());
}

// doStatistics
let doStatistics = function () {

    let globalIconCount = 0;
    let globalTrueCount = 0;

    let iconCount = 0;
    let trueCount = 0;

    // set hr statistics text
    let icon, hrList = document.getElementById("iconbox").getElementsByClassName("hr");
    // get count in same type
    for (let i = 0; i < hrList.length; ++i) {
        // get label text
        let label = hrList[i].getElementsByTagName("span")[0].textContent;
        let checked = false;

        icon = hrList[i];
        // get icon count
        while (true) {
            icon = icon.nextElementSibling;

            // keep loop in icon
            if (!icon || icon.tagName != "IMG") break;
            globalIconCount++;
            globalTrueCount += icon.alt == "true" ? 1 : 0;

            // if (icon.hidden) continue;
            iconCount++;
            trueCount += icon.alt == "true" ? 1 : 0;

            if (icon.alt == "false") checked = true;
        }
        // set text & result & button
        let ratio = `${Math.floor(100 * trueCount / iconCount)}%（${trueCount}/${iconCount}）`;
        hrList[i].innerHTML = `<div style="margin-top: 1px;"><span>${label}</span><span style="float: right;">${ratio}</span><input type="checkbox" id="f${i}" onclick="selectGroup(this);"><label for="f${i}">一括${checked ? "選択" : "解除"}</label></div>`;
        hrList[i].getElementsByTagName("input")[0].checked = checked;

        // reset icon count
        iconCount = 0;
        trueCount = 0;
    }
    return `所有率: ${Math.floor(100 * globalTrueCount / globalIconCount)} % （${globalTrueCount}/${globalIconCount}）`;
}
// selector
let selectGroup = function (checkbox) {
    // get backup
    let flagList = getIconFlags();

    // get flag
    let checked = checkbox.checked;
    // set new text
    checkbox.nextElementSibling.textContent = `一括${checked ? "選択" : "解除"}`;
    // set icon witch in group
    let hr = checkbox.parentElement.parentElement;
    let icon = hr;
    while (true) {
        icon = icon.nextElementSibling;

        if (!icon || icon.tagName != "IMG") break;
        icon.alt = !checked;
    }

    // set url data
    let newList = getIconFlags();
    setUrlParams(newList);
    // backup
    if (newList != flagList) {
        urlHistory.push(flagList);
    }
}

// sort method
let sortMode = "";
let sortByDate = function (ascending) {
    sortMode = ascending ? "DATE" : "date";
    $("#iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by id
        if (aData.id != bData.id) return (!!ascending == (aData.id < bData.id)) ? -1 : 1;

        return 0;
    })

    init();
    setHr("year");
}
let sortByRare = function (ascending) {
    sortMode = ascending ? "RARE" : "rare";
    $("#iconbox").empty();

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
let sortByClass = function (ascending) {
    sortMode = ascending ? "CLASS" : "class";
    $("#iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;

        // sort by class
        if (aData.classId != bData.classId) return (!!ascending == (aData.classId < bData.classId)) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("classId");
}
let sortByKind = function () {
    sortMode = "kind";
    $("#iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by kind
        if (aData.kind != bData.kind) return (aData.kind < bData.kind) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("kind");
}
let sortByEvent = function () {
    sortMode = "isEvent";
    $("#iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort down rare 3.5
        if (aData.rare == 3.5) return 1;
        if (bData.rare == 3.5) return -1;

        // sort by isEvent
        if (aData.isEvent != bData.isEvent) return (aData.isEvent > bData.isEvent) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("isEvent");
}
let sortByAssign = function () {
    sortMode = "assign";
    $("#iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by assign
        if (aData.assign == 0) return 1;
        if (bData.assign == 0) return -1;
        if (aData.assign != bData.assign) return (aData.assign < bData.assign) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("assign");
}
let sortByGenus = function () {
    sortMode = "genus";
    $("#iconbox").empty();

    charaData.sort(function compare(aData, bData) {
        // sort by genus
        if (aData.genus == 0) return 1;
        if (bData.genus == 0) return -1;
        if (aData.genus != bData.genus) return (aData.genus < bData.genus) ? -1 : 1;

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("genus");
}
let sortByYearGacha = function () {
    sortMode = "yearGacha";
    $("#iconbox").empty();

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

        // sort by rare
        if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
        // sort by group
        if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    })

    init();
    setHr("yearGacha");
}

// undo method
let urlHistory = [];
let undo = function () {
    let flagList = urlHistory.pop();
    if (!flagList) return;
    setUrlParams(flagList);
    setIconFlags(flagList);
}

// html result to image
let openImage = function () {
    $(window).scrollTop(0);
    html2canvas(document.getElementById("iconbox")).then(function (canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        window.open().document.write(`<img src="${image.src}" />`);
    });
}

let copyUrl = function () {
    document.getElementById("_sharebox").select();
    document.execCommand("copy");
}

let setShareButton = function (currentUri) {
    function isMobile() { try { document.createEvent("TouchEvent"); return true; } catch (e) { return false; } }
    document.getElementById("_twitterBtn").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(currentUri);
    document.getElementById("_lineBtn").href = "line://msg/text/" + encodeURIComponent(currentUri);
    document.getElementById("_plurkBtn").href = isMobile() ?
        "https://plurk.com/?qualifier=shares&content=" + encodeURIComponent(currentUri) :
        "https://plurk.com/?qualifier=shares&status=" + encodeURIComponent(currentUri);
}