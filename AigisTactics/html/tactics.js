

let bodyOnload = function () {
    questList.sort((a, b) => { return a.id.localeCompare(b.id); })
    // console.log("bodyOnload");

    let select = document.getElementById("missionType");
    select.options.add(new Option("＝＝分類＝＝", ""));
    select.options.add(new Option("ストーリーミッション", "Story"));
    select.options.add(new Option("英傑の塔", "Tower"));
    select.options.add(new Option("曜日ミッション", "Daily"));

    select.options.add(new Option("緊急ミッション", "Emergency"));
    select.options.add(new Option("デイリー復刻", "DailyReproduce"));

    select.options.add(new Option("魔神降臨", "Devil"));
    select.options.add(new Option("神獣降臨", "Raid"));

    select.options.add(new Option("交流クエスト", "Harlem"));
    select.options.add(new Option("戦術指南/チャレンジクエスト", "Challenge"));

    select.options.add(new Option("ゴールドラッシュ", "Goldrush"));
    select.options.add(new Option("復刻ミッション", "Reproduce"));
    select.options.add(new Option("大討伐", "Subjugation"));
    select.options.add(new Option("特別ミッション", "Special"));

    select = document.getElementById("mission");
    select.options.add(new Option("＝＝ミッション＝＝", ""));

    select = document.getElementById("quest");
    select.options.add(new Option("＝＝クエスト＝＝", ""));

    iconboxInit();
}
let iconboxInit = function () {
    // skip data
    let i = 0;
    while (i < charaData.length) {
        chara = charaData[i];
        if (!chara) { ++i; continue; }

        let skipList = [1];
        if (skipList.indexOf(chara.id) != -1) {  // skip who not a unit
            // skip
            charaData.splice(i, 1);
            continue;
        }
        ++i;
    }

    // sort database
    charaData.sort(function compare(aData, bData) {
        // sort
        if ((aData.sortGroupID < 20) != (bData.sortGroupID < 20)) {
            // npc unit
            if (aData.sortGroupID < 20) return 1;
            if (bData.sortGroupID < 20) return -1;
        } else {
            if (aData.sortGroupID < 20 && bData.sortGroupID < 20) {
                // npc unit
                if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
            } else {
                // normal unit, sort by rare
                if (aData.rare != bData.rare) return (aData.rare > bData.rare) ? -1 : 1;
            }
        }

        // sort by class
        if (aData.classId != bData.classId) return (aData.classId < bData.classId) ? -1 : 1;
        // sort by id
        if (aData.id != bData.id) return (aData.id < bData.id) ? -1 : 1;

        return 0;
    });

    // import icon button
    let iconbox = document.getElementById("iconbox");
    for (let i in charaData) {
        if (charaData[i] == null) continue;

        // build dom element
        let icon = document.createElement("img");
        // icon.id = charaData[i].id;
        icon.className = "iconbtn";
        icon.title = charaData[i].name; // + "," + charaData[i].classId;
        icon.src = charaData[i].img;
        icon.alt = charaData[i].id;

        // onclick event
        icon.addEventListener("click", addIcon, false);

        // append
        iconbox.appendChild(icon);
    }

    // set hr
    for (let i = 0; i < iconbox.childElementCount; ++i) {
        // get image & id
        let a = iconbox.children[i];
        let b = iconbox.children[i + 1];
        if (!a || !b || a.tagName != "IMG" || b.tagName != "IMG") continue;

        // get icon data
        let aData = charaData.find(chara => (chara && chara.id == a.alt));
        let bData = charaData.find(chara => (chara && chara.id == b.alt));
        if (!aData || !bData) continue;

        // set text
        let aText = "";
        let bText = "";

        let textList = ["アイアン", "ブロンズ", "シルバー", "ゴールド", "プラチナ", "ブラック"];
        aText = aData.rare == 3.5 ? "サファイア" : textList[parseInt(aData.rare)];
        bText = bData.rare == 3.5 ? "サファイア" : textList[parseInt(bData.rare)];

        textList = { 10: "聖霊", 11: "トークン/NPC", 12: "その他" };
        if (aData.sortGroupID < 20) { aText = textList[parseInt(aData.sortGroupID)]; }
        if (bData.sortGroupID < 20) { bText = textList[parseInt(bData.sortGroupID)]; }

        // set hr or not
        let hr = document.createElement("div");
        hr.className = "hr";
        if (i == 0) {
            hr.innerHTML = `<span>${aText}</span>`;
            a.parentNode.insertBefore(hr, a);
        } else if (aText != bText) {
            hr.innerHTML = `<span>${bText}</span>`;
            a.parentNode.insertBefore(hr, b);
        }
    }
}
let iconCount = 0;
let addIcon = function (event) {
    // get chara id
    let id = event.target.alt;

    // get chara data
    let icon = charaData.find(icon => { return icon.id == id; })
    if (!icon) console.log("addIcon error", id);

    // gat mapimg
    let mapimg = document.getElementById("mapimg");

    // set newIcon element
    let newIcon = document.createElement("img");
    newIcon.className = "icon";
    newIcon.title = icon.name; // + "," + icon.classId;
    newIcon.src = icon.img;
    newIcon.id = "icon" + iconCount;    // for drag
    newIcon.style.left = 30 + parseInt(iconCount % 20) * 25 + "px";
    newIcon.style.top = 30 + parseInt(iconCount / 20) * 25 + "px";

    newIcon.addEventListener("dragstart", onDragStart, false);

    mapimg.appendChild(newIcon);
    iconCount++;
}


// select options
let onChangeSelect = function (select) {
    if (select.id == "missionType") { onChangeSelectMissionType(select); }
    else if (select.id == "mission") { onChangeSelectMission(select); }
    else if (select.id == "quest") { onChangeSelectQuest(select); }
}
let onChangeSelectMissionType = function (select) {
    // change type
    let i = select.selectedIndex;
    let value = select.options[i].value;

    // get selected
    let missionSelect = document.getElementById("mission");
    // clear items
    missionSelect.innerText = null;
    let items = [];
    let missionIds = Object.keys(missionNameList);

    switch (value) {

        case "Story": {
            items = missionIds.filter(mId => {
                return parseInt(mId) < 110000;
            });
        } break;

        case "Tower": {
            items = missionIds.filter(mId => {
                return 110000 <= parseInt(mId) && parseInt(mId) < 200000;
            });
        } break;

        case "Goldrush": {
            items = missionIds.filter(mId => {
                return missionNameList[mId].indexOf("ゴールドラッシュ") != -1;
            });
        } break;

        case "Emergency": {
            items = missionIds.filter(mId => {
                return 200000 <= parseInt(mId) && parseInt(mId) < 300000 &&
                    missionNameList[mId].indexOf("ゴールドラッシュ") == -1 &&
                    missionNameList[mId].indexOf("異世界") == -1;
            });
            items.sort((a, b) => { return b.localeCompare(a); });   // sort by missionId & reverse 
        } break;
        case "Reproduce": {
            items = missionIds.filter(mId => {
                return 300000 <= parseInt(mId) && parseInt(mId) < 310000 &&
                    missionNameList[mId].indexOf("ゴールドラッシュ") == -1 &&
                    missionNameList[mId].indexOf("異世界") == -1;
            });
        } break;
        case "DailyReproduce": {
            items = missionIds.filter(mId => {
                return 310000 <= parseInt(mId) && parseInt(mId) < 320000
            });
        } break;
        case "Special": {
            items = missionIds.filter(mId => {
                return 320000 <= parseInt(mId) && parseInt(mId) < 400000 ||
                    missionNameList[mId].indexOf("異世界") != -1;
            });
        } break;

        case "Subjugation": {
            items = missionIds.filter(mId => {
                return 400000 <= parseInt(mId) && parseInt(mId) < 500000
            });
        } break;
        case "Devil": {
            items = missionIds.filter(mId => {
                return 500000 <= parseInt(mId) && parseInt(mId) < 600000
            });
        } break;
        case "Raid": {
            items = missionIds.filter(mId => {
                return 900001 < parseInt(mId) && parseInt(mId) < 1000000
            });
        } break;

        case "Daily": { items = ["700001"]; } break;
        case "Harlem": { items = ["600001"]; } break;

        case "Challenge": { items = ["800001", "900001"]; } break;
    }

    // set select items
    missionSelect.options.add(new Option("＝＝ミッション＝＝", ""));
    for (let i in items) {
        let item = items[i];
        missionSelect.options.add(new Option(missionNameList[item], item));
    }
}
let onChangeSelectMission = function (select) {
    // change mission
    let i = select.selectedIndex;
    let value = select.options[i].value;

    // get selected
    let questSelect = document.getElementById("quest");
    questSelect.innerText = null;
    let items = questList.filter(quest => { return quest.missionId == value; });

    // sort daily
    if (value == "700001") {
        items.sort((a, b) => { return a.questTitle[0].localeCompare(b.questTitle[0]); })
    }

    // set select items
    let str = items.length == 0 ? "＝＝no data＝＝" : "＝＝クエスト＝＝ (" + items.length + ")"
    questSelect.options.add(new Option(str, ""));
    for (let i in items) {
        let item = items[i];
        questSelect.options.add(new Option(item.questTitle, item.id));
    }
}
let onChangeSelectQuest = function (select) {
    // change quest
    let i = select.selectedIndex;
    let value = select.options[i].value;

    // get selected
    let quest = questList.find(quest => { return quest.id == value; });

    // clear map image
    let mapimg = document.getElementById("mapimg");
    mapimg.innerHTML = null; iconCount = 0;

    // set bg map image
    let md5 = hashList["Map" + quest.map + ".png"];
    mapimg.style.backgroundImage = "url(./maps/" + md5 + ")";

    // set range element
    let radius = parseInt(document.getElementById("rangebox").value) + 40;
    let range = document.createElement("div");
    range.id = "range";
    range.style.visibility = "hidden";
    range.style.width = (radius * 1.5) + "px";
    range.style.height = (radius * 1.5) + "px";
    range.className = "range";
    range.addEventListener("ondrop", onDrop, false);
    range.addEventListener("ondragover", onDragOver, false);
    mapimg.appendChild(range);
    // range.style.visibility = "visible";

    // get location data
    for (let i in quest.locationList) {
        let local = quest.locationList[i];
        let div = document.createElement("div");
        div.style.left = local.X + "px";
        div.style.top = local.Y + "px";

        // check location type
        if (local.ObjectID == 0) div.className = "goal";
        else if (200 <= local.ObjectID && local.ObjectID < 300) div.className = "near";
        else if (300 <= local.ObjectID && local.ObjectID < 400) div.className = "afar";
        else continue;

        // add event
        div.addEventListener("ondrop", onDrop, false);
        div.addEventListener("ondragover", onDragOver, false);
        div.addEventListener("click", onClick, false);

        mapimg.appendChild(div);
    }
}

let onChangeInput = function (select) {
    if (select.id == "rangebox") { onChangeInputRangebox(select); }
    else if (select.id == "filterbox") { onChangeInputFilterbox(select); }
}
let onChangeInputRangebox = function (select) {
    // set range element
    let radius = parseInt(select.value) + 40;
    let range = document.getElementById("range");
    range.style.width = (radius * 1.5) + "px";
    range.style.height = (radius * 1.5) + "px";

    // check visibility
    if (range.style.visibility == "hidden") { return; }

    setLocationOpacity(false);
}
let onChangeInputFilterbox = function (select) {
    // set range element
    let filter = select.value;

    // get all button
    let iconbtn = document.getElementsByClassName("iconbtn");
    for (let i in Array.from(iconbtn)) {
        let btn = iconbtn[i];

        if (!!filter && btn.title.indexOf(filter) == -1) {
            // btn.style.visibility = "hidden";
            btn.hidden = true;
        } else {
            // btn.style.visibility = "visible";
            btn.outerHTML = btn.outerHTML.replace("hidden", " ");
        }
    }
}

// set locations opacity
let setLocationOpacity = function (isHidden) {
    let range = document.getElementById("range");
    let radius = parseInt(document.getElementById("rangebox").value);
    let x0 = parseInt(range.style.left);
    let y0 = parseInt(range.style.top);

    let locals = document.querySelectorAll(".afar, .near");
    for (let i in locals) {
        let local = locals[i];
        if (local.tagName != "DIV") continue;

        if (isHidden) {
            local.style.opacity = "1.0";
        } else {
            // get distance
            let x = parseInt(local.style.left);
            let y = parseInt(local.style.top);
            let distance = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)) / 0.75;

            if (distance <= radius) {
                local.style.opacity = "1.0";
            } else if (distance <= (radius + 40)) {
                local.style.opacity = "0.55";
            } else {
                local.style.opacity = "0.1";
            }
        }
    }
}


// event method
let onDragStart = function (event) {
    // console.log("dragStart");

    // save drag image dom id
    event.dataTransfer.setData("imgId", event.target.id);
    event.dataTransfer.setData("startX", event.clientX);     // Get the horizontal coordinate
    event.dataTransfer.setData("startY", event.clientY);     // Get the vertical coordinate

    // set map image alpha 0.5
    document.getElementById("mapimg").title = "alpha";
}
let onDragOver = function (event) {
    // console.log("ondragover");
    event.preventDefault();
}
let onDrop = function (event) {
    // console.log("drop");
    event.preventDefault();

    // get mapimg
    let mapimg = document.getElementById("mapimg");
    // set map alpha 0.0
    mapimg.title = "";

    // get drop area
    let target = event.target;
    let className = target.className;

    // get drag image
    let img = document.getElementById(event.dataTransfer.getData("imgId"));
    let startX = event.dataTransfer.getData("startX");
    let startY = event.dataTransfer.getData("startY");
    let endX = event.clientX;
    let endY = event.clientY;

    // change img posion
    if (className == "goal") {
        mapimg.removeChild(img);
    } else if (className == "near" || className == "afar") {
        img.style.left = target.style.left;
        img.style.top = target.style.top;
    } else if (className == "mapimg" || className == "range") {
        img.style.left = parseInt(img.style.left) + endX - startX + "px";
        img.style.top = parseInt(img.style.top) + endY - startY + "px";
    }
}
// location onClick
let onClick = function (event) {
    // set range element
    let range = document.getElementById("range");

    // check posion
    let flag = false;
    if (range.style.left != event.target.style.left ||
        range.style.top != event.target.style.top) {
        flag = true;
    }

    // set position
    range.style.left = event.target.style.left;
    range.style.top = event.target.style.top;

    // set visibility
    if (range.style.visibility == "hidden" || flag) {
        range.style.visibility = "visible";
        flag = false;
    } else {
        range.style.visibility = "hidden";
        flag = true;
    }

    setLocationOpacity(flag);
}


