
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

    onChangeInputMemobox();
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
    // newIcon.alt = "";   // cc/aw/aw2a/aw2b tag
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

    // sharebox
    let shareText = "【千年戦争アイギス】　作戦図＋\n"
    shareText += url;
    shareText += "\n #アイギス作戦図 \n #千年戦争アイギス ";

    document.getElementById("_sharebox").textContent = shareText;
    setShareButton(shareText);
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
    MapImg.style.backgroundImage = `url(./maps/${md5})`;

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
        div.value = "40";
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
    else if (select.id == "weatherType") { onChangeSelectWeather(select); }
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
let onChangeSelectWeather = function (select) {
    console.debug("onChangeSelectWeather");
    // change quest
    let i = select.selectedIndex;
    let weather = select.options[i].value;
    let ratioData = { "768_001.png": "0.7", "769_001.png": "0.5", "782_001.png": "0.8", "783_001.png": "0.65", "777_001.png": "0.7", "777_001.png": "0.5", "780_001.png": "0.8", "787_001.png": "0.7", "785_001.png": "0.7", "793_001.png": "0.6" }
    let ratio = ratioData[weather] || 1.0;

    let ratioBox = document.getElementById("rangeRatio");
    ratioBox.value = ratio;

    let bgimg = MapImg.style.backgroundImage.split(",")[0];
    let weatherImg = `url(./weather/${mapHashList[weather]})`;

    if (weather == "null") {
        MapImg.style.backgroundImage = bgimg;
    } else {
        MapImg.style.backgroundImage = `${bgimg}, ${weatherImg}`;
    }

    onChangeInputRatio(ratioBox);
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

    // change img posion
    if (className == "goal") {
        MapImg.removeChild(img);
    } else if (className == "location") {
        img.style.left = target.style.left;
        img.style.top = target.style.top;
    } else {
        // if (className == "mapimg" || className == "range")
        let startX = event.dataTransfer.getData("startX");
        let startY = event.dataTransfer.getData("startY");
        let endX = event.clientX;
        let endY = event.clientY;
        img.style.left = parseInt(img.style.left) + endX - startX + "px";
        img.style.top = parseInt(img.style.top) + endY - startY + "px";
    }
}


// onChangeInput
let onChangeInput = function (event) {
    let select = event.target;
    console.debug("onChangeInput");
    if (select.className == "inputrange") { onChangeInputRange(select); }
    else if (select.id == "filterbox") { onChangeInputFilter(select); }
    else if (select.id == "rangeRatio") { onChangeInputRatio(select); }
    else if (select.type = "color" || select.id == "textbox") { onChangeInputMemobox(select); }
}
let onChangeInputRange = function (select) {
    console.debug("onChangeInputRange");

    // check data
    let value = parseInt(select.value);
    if (isNaN(value) || value < 40) {
        value = 40;
        select.value = value;
    }

    nowFocus = document.getElementById(select.title);;
    lastFocus = null;
    drawMapImage();
}
let onChangeInputFilter = function (select) {
    console.debug("onChangeInputFilter");
    // set range element
    let filter = select.value;

    // get all button
    let iconItems = document.getElementById("iconbox").children;
    let hr = null, flag;
    for (let i = 0; i < iconItems.length; ++i) {
        let item = iconItems[i];
        if (item.className == "hr") {
            // set last hr visibility
            if (hr != null) { hr.style.display = flag ? "block" : "none"; }
            // cache last hr
            hr = item;
            flag = false;
            continue;
        }

        // btn filter
        if (!!filter && item.title.indexOf(filter) == -1) {
            // btn.style.visibility = "hidden";
            // btn.hidden = true;
            item.style.display = "none";
        } else {
            // btn.style.visibility = "visible";
            // btn.outerHTML = btn.outerHTML.replace("hidden", " ");
            item.style.display = "unset";
            flag = true;
        }
    }
}
let onChangeInputRatio = function (select) {
    console.debug("onChangeInputRatio");

    // check data
    let value = parseFloat(select.value);
    if (isNaN(value) || value <= 0.0) {
        value = 1.0;
        select.value = value;
    }

    nowFocus = MapImg;
    lastFocus = null;
    drawMapImage();
}
let onChangeInputMemobox = function (select) {
    console.debug("onChangeInputRatio");
    // WYSIWYG

    let box = document.getElementById("textbox");
    let teColor = document.getElementById("textcolorbox").value;
    let bgColor = document.getElementById("bgcolorbox").value;
    let bdColor = document.getElementById("outcolorbox").value;

    box.style.overflow = "hidden";
    box.style.color = teColor;
    box.style.background = bgColor;
    box.style.border = "2px solid " + bdColor;
}
let addMomebox = function () {
    console.debug("addMomebox");
    let box = document.getElementById("textbox");

    let div = document.createElement("div");
    div.id = "memo" + iconCount;    // for drag
    div.className = "memo";
    div.style.width = box.offsetWidth + "px";
    div.style.height = box.offsetHeight + "px";

    div.style.paddingLeft = "3px";

    div.style.overflow = "hidden";
    div.style.color = box.style.color;
    div.style.background = box.style.background;
    div.style.border = box.style.border;
    div.style.fontFamily = box.style.fontFamily;

    div.style.left = "30px";
    div.style.top = "30px";

    div.innerText = box.value;
    div.draggable = true;

    div.addEventListener("dragstart", onDragStart, false);

    MapImg.appendChild(div);
}




// location onClick
let nowFocus = "";
let lastFocus = "";
let mobileEvent = {};
let onClick = function (event) {
    console.debug("onClick", event.target.className, "<=", lastFocus.className);


    if (!isMobile()) {
        let waitInput = (document.querySelector("#mapimg .inputrange:focus, #mapimg .inputrange:hover") != null);
        if ((event.target.className == "mapimg" && !waitInput) || event.target.className == "location") {
            nowFocus = event.target;
            drawMapImage();
        }
    } else {
        nowFocus = event.target;
        if (nowFocus.className == "icon") {
            // save drag image dom id
            mobileEvent["imgId"] = nowFocus.id;
            mobileEvent["startX"] = event.clientX;     // Get the horizontal coordinate
            mobileEvent["startY"] = event.clientY;     // Get the vertical coordinate

            lastFocus = nowFocus;

        } else if (lastFocus.className == "icon") {
            // move icon images
            let img = lastFocus;
            let target = nowFocus;

            let movetion = async function (img, vx, vy, del) {
                let x0 = parseInt(img.style.left);
                let y0 = parseInt(img.style.top);

                for (let angle = 0; angle < 50; ++angle) {
                    let d = Math.sin(Math.PI * angle * 0.01);
                    img.style.left = x0 + Math.round(vx * d) + "px";
                    img.style.top = y0 + Math.round(vy * d) + "px";
                    await new Promise(resolve => setTimeout(resolve, 10));
                }

                if (!!del) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    MapImg.removeChild(img);
                }
            }

            // change img posion
            if (target.className == "goal") {
                let vx = parseInt(target.style.left) - parseInt(img.style.left);
                let vy = parseInt(target.style.top) - parseInt(img.style.top);
                movetion(img, vx, vy, true);
            } else if (target.className == "location") {
                let vx = parseInt(target.style.left) - parseInt(img.style.left);
                let vy = parseInt(target.style.top) - parseInt(img.style.top);
                movetion(img, vx, vy);
            } else {
                let startX = mobileEvent["startX"];
                let startY = mobileEvent["startY"];
                let endX = event.clientX;
                let endY = event.clientY;
                let vx = endX - startX;
                let vy = endY - startY;
                movetion(img, vx, vy);
            }

            lastFocus = nowFocus;

        } else if (event.target.className == "mapimg" || event.target.className == "location") {
            drawMapImage();
        }
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
        let ratioData = parseFloat(document.getElementById("rangeRatio").value);

        // draw range circle size
        range.style.width = Math.round(rangeData * ratioData * 1.5) + "px";
        range.style.height = Math.round(rangeData * ratioData * 1.5) + "px";

        // set rangeText
        // rangeText.innerText = (ratioData == 1.0) ? rangeData : `${rangeData} x ${ratioData.toFixed(2)} = \n${Math.round(rangeData * ratioData)}`;
        rangeText.innerText = (ratioData == 1.0) ? rangeData : `${rangeData} x ${ratioData.toFixed(2)}`;

        let setDistanceText = function ({ center, distanceText, location, hitbox }) {
            if (center.className == "mapimg") {
                // distanceText
                distanceText.innerText = (type == "near" ? "近" : "遠");
                distanceText.style.color = (type == "near" ? "#ffffff" : "#000000");
                distanceText.style.background = (type == "near" ? "#000000" : "#ffffff");

                // hitbox
                hitbox.style.visibility = "hidden";
                return;
            } else if (center.className == "location") {
                // distanceText
                let x0 = parseInt(center.style.left);
                let y0 = parseInt(center.style.top);
                let x = parseInt(location.style.left);
                let y = parseInt(location.style.top);
                let distance = Math.sqrt(Math.pow(x - x0, 2) + Math.pow(y - y0, 2)) / 0.75;
                distanceText.innerText = Math.round(distance);

                let nowFocusRange = parseInt(document.querySelector(`input.inputrange[title=${center.id}]`).value);
                let colorType = (nowFocusRange == 40) ? 0 : (((nowFocusRange * ratioData + 40) > distance) ? 1 : 2);
                distanceText.style.color = ["black", "black", "white"][colorType];
                distanceText.style.background = ["yellow", "#00ff00", "#ff0000"][colorType];

                // hitbox
                colorType = ((nowFocusRange * ratioData + 40) > distance);
                hitbox.style.backgroundColor = colorType ? "rgba(0, 128, 0, 0.2)" : "rgba(128, 0, 0, 0.2)";
                hitbox.style.borderColor = colorType ? "rgba(0, 255, 0, 0.65)" : "rgba(255, 0, 0, 0.65)";
                hitbox.style.visibility = "visible";
                return;
            }
            console.error("setDistanceText error: Unknown type center ", center.className);
        }

        // draw circle / text color & visibility
        if (nowFocus.className == "mapimg") {
            // distanceText
            // hitbox
            setDistanceText({ center: nowFocus, distanceText, hitbox });

            // rangeText
            rangeText.style.visibility = "hidden";
            inputrange.style.visibility = "hidden";

            // range
            // no response
        } else if (nowFocus.className == "location") {
            // distanceText
            // hitbox
            setDistanceText({ center: nowFocus, distanceText, hitbox, location });

            // rangeText
            rangeText.style.visibility = (nowFocus == location) ? "visible" : range.style.visibility;
            inputrange.style.visibility = (nowFocus == location) ? "visible" : range.style.visibility;

            // range
            if (nowFocus == location) {
                // switch
                let visibility = "hidden";
                if (range.style.visibility != "visible" || !lastFocus || lastFocus.id != nowFocus.id) {
                    visibility = "visible";
                }
                if (rangeData == 40) { visibility = "hidden"; }

                range.style.visibility = visibility;
            }
        }
    }

    lastFocus = nowFocus;
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
    // function isMobile() { try { document.createEvent("TouchEvent"); return true; } catch (e) { return false; } }
    document.getElementById("_twitterBtn").href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(currentUri);
    document.getElementById("_lineBtn").href = "line://msg/text/" + encodeURIComponent(currentUri);
    document.getElementById("_plurkBtn").href = isMobile() ?
        "https://plurk.com/?qualifier=shares&content=" + encodeURIComponent(currentUri) :
        "https://plurk.com/?qualifier=shares&status=" + encodeURIComponent(currentUri);
}
let isMobile = function () {
    let u = navigator.userAgent;
    let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    let isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    return isAndroid || isiOS;
}