
let MapImg;
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

    MapImg = document.getElementById("mapimg");
    nowFocus = MapImg;
    lastFocus = MapImg;
    let map = getUrlParams();
    if (map) {
        mapimgInit(map);
        // let mId = /^\d+/.exec(map).toString();
        // let qId = /\d+$/.exec(map).toString();
    }
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
        icon.draggable = false;

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
    console.debug("addIcon");
    // get chara id
    let id = event.target.alt;

    // get chara data
    let icon = charaData.find(icon => { return icon.id == id; })
    if (!icon) console.log("addIcon error", id);

    // set newIcon element
    let newIcon = document.createElement("img");
    newIcon.className = "icon";
    newIcon.title = icon.name; // + "," + icon.classId;
    newIcon.src = icon.img;
    newIcon.id = "icon" + iconCount;    // for drag
    newIcon.style.left = 30 + parseInt(iconCount % 20) * 25 + "px";
    newIcon.style.top = 30 + parseInt(iconCount / 20) * 25 + "px";

    newIcon.addEventListener("dragstart", onDragStart, false);

    MapImg.appendChild(newIcon);
    iconCount++;
}


// url param method
function getUrlParams() {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // get url data
    let urlData = params.get("map");

    // return flag list
    return urlData || false;
}
function setUrlParams(questFullId) {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // set data to url
    params.set("map", questFullId);
    history.pushState(null, null, url);

    // // sharebox
    // let shareText = "【千年戦争アイギス】ユニット所持チェッカー＋\n"
    // shareText += doStatistics() + "\n";
    // shareText += url;
    // shareText += "\n #アイギス所持チェッカー \n #千年戦争アイギス ";

    // document.getElementById("_sharebox").textContent = shareText;
    // setShareButton(shareText);
}


// init map image
let mapimgInit = function (id) {
    if (!id || id == "") { return; }
    setUrlParams(id);

    // get selected
    let quest = questList.find(quest => { return quest.id == id; });

    // clear map image
    MapImg.innerHTML = null;
    iconCount = 0;

    // set bg map image
    let md5 = mapHashList["Map" + quest.map + ".png"];
    MapImg.style.backgroundImage = "url(./maps/" + md5 + ")";

    // get location data
    for (let i in quest.locationList) {
        let location = quest.locationList[i];

        // location
        let div = document.createElement("div");
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";

        // check location type
        let imgname = ""
        if (location.ObjectID == 0) { div.className = "goal"; MapImg.appendChild(div);; continue; }
        else if (200 <= location.ObjectID && location.ObjectID < 300) { div.className = "location"; imgname = "near"; }
        else if (300 <= location.ObjectID && location.ObjectID < 400) { div.className = "location"; imgname = "afar"; }
        else continue;

        let dId = imgname + location.ObjectID;
        div.id = dId;
        MapImg.appendChild(div);

        // range
        div = document.createElement("div");
        div.className = "range";
        div.title = dId;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);

        // rangeText
        div = document.createElement("div");
        div.className = "rangeText";
        div.title = dId;
        div.style.left = location.X + "px";
        div.style.top = (parseInt(location.Y) + 31) + "px";
        MapImg.appendChild(div);

        // inputrange
        div = document.createElement("input");
        div.className = "inputrange";
        div.title = dId;
        div.type = "number";
        div.value = "0";
        div.style.left = location.X + "px";
        div.style.top = (parseInt(location.Y) + 31) + "px";
        div.addEventListener("change", onChangeInput, false);
        MapImg.appendChild(div);

        // img
        div = document.createElement("div");
        div.className = imgname;
        div.title = dId;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);

        // hitbox
        div = document.createElement("div");
        div.className = "hitbox";
        div.title = dId;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);

        // distanceText
        div = document.createElement("div");
        div.className = "distanceText";
        div.title = dId;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);



        // if (imgname != "") {
        //     let innerHTML = ""
        //     innerHTML += `<div class="range"></div>`

        //     innerHTML += `<div class="rangeText"></div>`
        //     innerHTML += `<input class="inputrange" type="number" value="0" onchange="onChangeInput(this);">`

        //     innerHTML += `<div class="${imgname}"></div>`;

        //     innerHTML += `<div class="hitbox"></div>`
        //     innerHTML += `<div class="distanceText"></div>`;

        //     div.innerHTML = innerHTML;
        //     div.id = imgname + location.ObjectID;
        // }




    }

    drawMapImage();
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
    mapimgInit(value);
}


// event method
let onDragStart = function (event) {
    console.debug("dragStart");

    // save drag image dom id
    event.dataTransfer.setData("imgId", event.target.id);
    event.dataTransfer.setData("startX", event.clientX);     // Get the horizontal coordinate
    event.dataTransfer.setData("startY", event.clientY);     // Get the vertical coordinate

    // set map image alpha 0.5
    MapImg.title = "alpha";
}
let onDragOver = function (event) {
    // console.log("ondragover");
    event.preventDefault();
}
let onDrop = function (event) {
    console.debug("drop", event.target.className);
    event.preventDefault();

    // set map alpha 0.0
    MapImg.title = "";

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
        MapImg.removeChild(img);
    } else if (className == "location") {
        img.style.left = target.style.left;
        img.style.top = target.style.top;
    } else// if (className == "mapimg" || className == "range")
    {
        img.style.left = parseInt(img.style.left) + endX - startX + "px";
        img.style.top = parseInt(img.style.top) + endY - startY + "px";
    }
}


// onChangeInput
let onChangeInput = function (event) {
    let select = event.target;
    console.debug("onChangeInput");
    if (select.className == "inputrange") { onChangeInputRange(select); }
    else if (select.id == "filterbox") { onChangeInputFilterbox(select); }
}
let onChangeInputRange = function (select) {
    console.debug("onChangeInputRange");
    nowFocus = document.querySelector(`#${select.title}`);
    lastFocus = MapImg;
    drawMapImage();
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
            // btn.hidden = true;
            btn.style.display = "none";
        } else {
            // btn.style.visibility = "visible";
            // btn.outerHTML = btn.outerHTML.replace("hidden", " ");
            btn.style.display = "inline";
        }
    }
}


// location onClick
let nowFocus = "";
let lastFocus = "";
let onClick = function (event) {
    console.debug("onClick", event.target.className, "<=", lastFocus.className);

    let waitInput = (document.querySelector("#mapimg .inputrange:focus, #mapimg .inputrange:hover") != null);
    if ((event.target.className == "mapimg" && !waitInput) || event.target.className == "location") {
        nowFocus = event.target;
        drawMapImage();
    }
}
// draw map image
let drawMapImage = function () {
    // get all location
    let locations = Array.from(MapImg.getElementsByClassName("location"));
    for (let i in locations) {
        let location = locations[i];
        let dId = locations[i].id;

        // get element
        let range = document.querySelector(`div.range[title=${dId}]`);
        let rangeText = document.querySelector(`div.rangeText[title=${dId}]`);
        let inputrange = document.querySelector(`input.inputrange[title=${dId}]`);
        let hitbox = document.querySelector(`div.hitbox[title=${dId}]`);
        let distanceText = document.querySelector(`div.distanceText[title=${dId}]`);

        // get data
        let type = /[^\d]+/.exec(dId).toString();
        let rangeData = parseInt(inputrange.value);
        if (isNaN(rangeData) || rangeData < 40) { rangeData = 40; }        // check data
        inputrange.value = rangeData;

        // set text
        let distance;
        rangeText.innerText = rangeData;
        if (nowFocus.className == "mapimg") {
            distanceText.innerText = (type == "near" ? "近" : "遠");
        } else if (nowFocus.className == "location") {
            let x0 = parseInt(nowFocus.style.left);
            let y0 = parseInt(nowFocus.style.top);

            let x = parseInt(location.style.left);
            let y = parseInt(location.style.top);
            distance = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)) / 0.75;

            distanceText.innerText = Math.round(distance);
        }

        // draw range circle size
        range.style.width = (rangeData * 1.5) + "px";
        range.style.height = (rangeData * 1.5) + "px";

        // draw circle / text color & visibility
        if (nowFocus.className == "mapimg") {
            // distanceText
            distanceText.style.color = (type == "near" ? "#ffffff" : "#000000");
            distanceText.style.background = (type == "near" ? "#000000" : "#ffffff");

            // hitbox
            hitbox.style.visibility = "hidden";

            // rangeText
            rangeText.style.visibility = "hidden";
            inputrange.style.visibility = "hidden";

            // range
            // no response
        } else {
            // distanceText
            let nowFocusRange = parseInt(document.querySelector(`input.inputrange[title=${nowFocus.id}]`).value);
            if (nowFocusRange == 40) { nowFocusRange = 2000; }
            distanceText.style.color = ((nowFocusRange + 40) > distance) ? "#000000" : "#ffffff";;
            distanceText.style.background = ((nowFocusRange + 40) > distance) ? "#00ff00" : "#ff0000";;

            // hitbox
            hitbox.style.visibility = "visible";
            // range
            if (nowFocus == location) {
                // switch
                let visibility = "hidden";
                if (range.style.visibility != "visible" || lastFocus.id != nowFocus.id) {
                    visibility = "visible";
                }
                if (rangeData == 40) { visibility = "hidden"; }

                range.style.visibility = visibility;
            }

            // rangeText
            if (nowFocus == location) {
                rangeText.style.visibility = "visible";
                inputrange.style.visibility = "visible";

            } else {
                rangeText.style.visibility = range.style.visibility;
                inputrange.style.visibility = range.style.visibility;
            }
        }

        // let visibility = (range.style.visibility != "visible" ? "visible" : "hidden")
        // range.style.visibility = visibility;



        // distanceText.style.visibility = "visible";




        // innerHTML += `<div class="range"></div>`

        // innerHTML += `<div class="rangeText"></div>`
        // innerHTML += `<input class="inputrange" type="number" value="0" onchange="onChangeInput(this);">`

        // innerHTML += `<div class="${imgname}"></div>`;

        // innerHTML += `<div class="hitbox"></div>`
        // innerHTML += `<div class="distanceText"></div>`;


    }

    lastFocus = nowFocus;
}




// let onClickTest = function (event) {
//     console.log(event.target);
// }
