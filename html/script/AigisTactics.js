
let MapImg;
let MapID;
// let debulQuestList = [];

let isOuji = function (data) {
    return (data.sortGroupID == 25 && data.rare == 5 &&
        ![418, 1396, 2230].includes(data.id)
    );
}

let bodyOnload = function () {
    questList.sort((a, b) => { return a.id.localeCompare(b.id); })
    // console.log("bodyOnload");

    let select = document.getElementById("missionType");
    select.options.add(new Option("＝＝分類＝＝", ""));
    select.options.add(new Option("ストーリーミッション", "Story"));
    select.options.add(new Option("英傑の塔", "Tower"));
    select.options.add(new Option("曜日ミッション", "Daily"));
    select.options.add(new Option("", ""));

    select.options.add(new Option("緊急ミッション", "Emergency"));
    select.options.add(new Option("デイリー復刻", "DailyReproduce"));
    select.options.add(new Option("イベントヒストリー 一年目", "History01"));
    select.options.add(new Option("イベントヒストリー 二年目", "History02"));
    select.options.add(new Option("イベントヒストリー 三年目", "History03"));
    select.options.add(new Option("イベントヒストリー 四年目", "History04"));
    select.options.add(new Option("イベントヒストリー 五年目", "History05"));
    select.options.add(new Option("イベントヒストリー 六年目", "History06"));
    select.options.add(new Option("イベントヒストリー 七年目", "History07"));
    select.options.add(new Option("イベントヒストリー 八年目", "History08"));
    select.options.add(new Option("イベントヒストリー 九年目", "History09"));
    select.options.add(new Option("イベントヒストリー 十年目", "History10"));
    select.options.add(new Option("イベントヒストリー 十一年目", "History11"));
    // select.options.add(new Option("イベントヒストリー 十二年目", "History12"));
    select.options.add(new Option("", ""));

    select.options.add(new Option("復刻ミッション", "Reproduce"));
    select.options.add(new Option("ゴールドラッシュ", "Goldrush"));
    select.options.add(new Option("大討伐", "Subjugation"));
    select.options.add(new Option("", ""));

    select.options.add(new Option("魔神降臨", "Devil"));
    select.options.add(new Option("神獣降臨", "Raid"));
    select.options.add(new Option("", ""));

    select.options.add(new Option("交流クエスト", "Harlem"));
    select.options.add(new Option("戦術指南/チャレンジクエスト", "Challenge"));
    select.options.add(new Option("特別ミッション", "Special"));

    // select.options.add(new Option("DEBUG", "Debug"));

    select = document.getElementById("mission");
    select.options.add(new Option("＝＝ミッション＝＝", ""));

    select = document.getElementById("quest");
    select.options.add(new Option("＝＝クエスト＝＝", ""));

    onChangeInputMemobox();
    iconboxInit();

    MapImg = document.getElementById("mapimg");
    let map = getUrlParams();
    if (map) {
        mapimgInit(map);
    }
}
let iconboxInit = function () {
    // skip data
    let i = 0;
    let list = document.querySelector('#searchList');
    while (i < charaData.length) {
        chara = charaData[i];
        if (!chara) { ++i; continue; }

        let skipList = [1];
        if (skipList.indexOf(chara.id) != -1 ||             // skip who not a normal unit
            chara.name.indexOf("ダミー") != -1 ||
            (chara.name == "刻聖霊ボンボリ" && chara.id != 290)
        ) {
            // skip
            charaData.splice(i, 1);
            continue;
        }
        ++i;

        // search bar list
        let option = document.createElement('option');
        option.value = chara.name;
        list.appendChild(option);
    }

    // sort database
    charaData.sort(function compare(aData, bData) {
        // sort
        let iA, iB;

        // iA = aData.placeType; iA = (iA == 0 || aData.isToken) ? 4 : iA;
        // iB = bData.placeType; iB = (iB == 0 || bData.isToken) ? 4 : iB;
        // if (iA != iB) return (iA < iB) ? -1 : 1;

        iA = (aData.isToken || aData.placeType == 0) ? 1 : 0;
        iB = (bData.isToken || bData.placeType == 0) ? 1 : 0;
        if (iA != iB) return (iA < iB) ? -1 : 1;

        // sort by rare
        iA = aData.rare;
        iB = bData.rare;
        if (iA == 7) iA = 3.5;
        if (iB == 7) iB = 3.5;
        if (iA >= 10) iA = iA - 5.9;
        if (iB >= 10) iB = iB - 5.9;
        if (isOuji(aData)) iA = 5.2;
        if (isOuji(bData)) iB = 5.2;
        if (aData.sortGroupID == 10) iA = -1;
        if (aData.sortGroupID == 10) iB = -1;
        if (aData.isToken) iA = -2;
        if (aData.isToken) iB = -2;

        if (iA != iB) return (iA > iB) ? -1 : 1;



        // if ((aData.sortGroupID < 25) != (bData.sortGroupID < 25)) {
        //     // npc unit
        //     if (aData.sortGroupID < 20) return 1;
        //     if (bData.sortGroupID < 20) return -1;
        // } else {
        //     if (aData.sortGroupID < 20 && bData.sortGroupID < 20) {
        //         // npc unit
        //         if (aData.sortGroupID != bData.sortGroupID) return (aData.sortGroupID < bData.sortGroupID) ? -1 : 1;
        //     } else {
        //         // normal unit, sort by rare
        //         let iA, iB;
        //         iA = aData.rare; iA = iA == 7 ? 3.5 : iA;
        //         iB = bData.rare; iB = iB == 7 ? 3.5 : iB;
        //         // sort by rare
        //         if (iA != iB) return (iA > iB) ? -1 : 1;
        //     }
        // }

        // sort by class
        if (aData.classID != bData.classID) return (aData.classID < bData.classID) ? -1 : 1;
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
        icon.title = charaData[i].name; // + "," + charaData[i].classID;
        icon.draggable = false;

        icon.alt = charaData[i].id;
        icon.src = "./icons/" + charaData[i].img;

        // // onclick event
        // icon.addEventListener("click", addIcon, false);

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
        let aData = charaData.find(chara => (chara && chara.id == parseInt(a.alt)));
        let bData = charaData.find(chara => (chara && chara.id == parseInt(b.alt)));
        if (!aData || !bData) continue;

        // set text
        let aText = "";
        let bText = "";

        let textList = ["アイアン", "ブロンズ", "シルバー", "ゴールド", "プラチナ", "ブラック", , "サファイア", , , "プラチナ", "ブラック"];
        aText = textList[parseInt(aData.rare)];
        bText = textList[parseInt(bData.rare)];

        if (aData.sortGroupID == 10) { aText = "聖霊"; }
        if (bData.sortGroupID == 10) { bText = "聖霊"; }
        if (aData.isToken) { aText = "トークン/NPC"; }
        if (bData.isToken) { bText = "トークン/NPC"; }
        // textList = { 10: "聖霊", 11: "トークン/NPC", 12: "その他" };
        // if (aData.sortGroupID < 20) { aText = textList[parseInt(aData.sortGroupID)]; }
        // if (bData.sortGroupID < 20) { bText = textList[parseInt(bData.sortGroupID)]; }

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
let onClickIconbox = function (event) {
    if (event.target.className != "iconbtn") return;
    console.debug("addIcon");

    let alt = event.target.alt;   // cc/aw/aw2a/aw2b tag
    let left = 30 + parseInt(iconCount % 20) * 25 + "px";
    let top = 30 + parseInt(iconCount / 20) * 25 + "px";

    _addIcon({ alt, left, top })
}
let _addIcon = function ({ alt, left, top }) {
    // get chara data
    let icon = charaData.find(icon => { return icon.id == parseInt(alt); })
    if (!icon) console.log("addIcon error", alt);

    // set newIcon element
    let newIcon = document.createElement("img");
    newIcon.id = "icon" + iconCount;    // for drag
    newIcon.className = "icon";
    newIcon.title = icon.name; // + "," + icon.classID;

    newIcon.alt = alt;   // cc/aw/aw2a/aw2b tag
    let status = alt.replace(parseInt(alt), "");
    let iconHash = icon.img;
    if (status == "aw")
        iconHash = icon.imgaw || iconHash;
    else if (status == "aw2A")
        iconHash = icon.imgaw2A || icon.imgaw || iconHash;
    else if (status == "aw2B")
        iconHash = icon.imgaw2B || icon.imgaw || iconHash;
    newIcon.src = "./icons/" + iconHash;

    newIcon.style.left = left;
    newIcon.style.top = top;

    newIcon.addEventListener("dragstart", onDragStart, false);

    MapImg.appendChild(newIcon);
    iconCount++;
}


// url param method
let getUrlParams = function () {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // get url data
    let urlData = params.get("map");

    // return flag list
    return urlData || false;
}
let setUrlParams = function (questFullID) {
    // URL obj
    let url = new URL(document.URL);
    let params = url.searchParams;

    // set data to url
    params.set("map", questFullID);
    history.pushState(null, null, url);

    // sharebox
    let shareText = "【千年戦争アイギス】　作戦図＋\n"
    shareText += url;
    shareText += "\n #アイギス作戦図 \n #千年戦争アイギス ";

    document.getElementById("_sharebox").textContent = shareText;
    setShareButton(shareText);
}
let getMapSummary = function () {
    // let mapInfo = MapImg.innerHTML.replace(/></g, ">\n<").split("\n");
    let information = { MapID };

    for (let i in MapImg.childNodes) {
        let dom = MapImg.childNodes[i];

        if (dom.tagName == "INPUT") {
            let title = dom.title;
            let range = dom.value;

            if (range > 40) { information[title] = range; }
        } else if (dom.className == "icon") {
            let id = dom.id;    // "icon5"
            let alt = dom.alt;  // "999aw2"
            let left = dom.style.left;
            let top = dom.style.top;

            information[id] = { alt, left, top };
        } else if (dom.className == "memo") {
            let id = dom.id;

            let text = dom.innerHTML;
            let width = dom.style.width;
            let fontSize = dom.style.fontSize;
            let color = dom.style.color;
            let background = dom.style.background;
            let border = dom.style.border;
            let left = dom.style.left;
            let top = dom.style.top;

            information[id] = { text, width, fontSize, color, background, border, left, top };
        }
    }

    // return JSON.stringify(information);
    return information;
}
let setMapSummary = function (information) {
    let keys = Object.keys(information);

    mapimgInit(information["MapID"]);

    for (let i in keys) {
        let key = keys[i];
        if (/afar\d+|near\d+/.test(key)) {
            // set location range
            document.querySelector(`input.inputrange[title = ${key}]`).value =
                information[key];

        } else if (/icon\d+/.test(key)) {
            // set icon
            _addIcon(information[key]);

        } else if (/memo\d+/.test(key)) {
            // set memo
            _addMomebox(information[key]);
        }
    }

    drawMapImage();
}
let dataSave = function () {
    let information = getMapSummary();
    // // qrcode
    // window.open().document.write(`<img src="https://chart.googleapis.com/chart?chs=300x300&chld=M|2&cht=qr&chl=${encodeURIComponent(data)}" /> `);

    // json file
    let quest = questList.find(quest => quest.id == MapID)
    let name = `[${quest.missionTitle}] ${quest.questName}.json`;
    let data = JSON.stringify(information, null, "\t");

    saveFile(name, data);
}
let dataRestore = function (event) {
    let fileList = event.target.files;
    if (fileList.length == 1 && !!fileList[0]) {
        var reader = new FileReader();

        reader.readAsText(fileList[0], 'UTF-8');
        reader.onload = function (e) { setMapSummary(JSON.parse(this.result)); };
    }

    // clear file
    event.target.value = "";
}


// init map image
let mapimgInit = function (id) {
    if (!id || id == "") { return; }
    setUrlParams(id);
    MapID = id;

    // get selected
    let quest = questList.find(quest => { return quest.id == id; });

    // clear map data
    MapImg.innerHTML = null;
    iconCount = 0;
    nowFocus = MapImg;
    lastFocus = MapImg;

    // set bg map image
    // let md5 = mapHashList["Map" + quest.map + ".png"];
    // MapImg.style.backgroundImage = `url(./maps/${md5})`;
    MapImg.style.backgroundImage = `url(./maps/Map${quest.map})`;

    // get location data
    let locationList = mapDataList[quest.map][quest.location];
    if (mapDataList[quest.map][`Entry${quest.entry}`]) {
        locationList = locationList.concat(mapDataList[quest.map][`Entry${quest.entry}`]);
    }
    // set location data to map
    for (let location of locationList) {

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

        let dID = imgname + location.ObjectID;
        div.id = dID;
        MapImg.appendChild(div);

        // range
        div = document.createElement("div");
        div.className = "range";
        div.title = dID;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);

        // rangeText
        div = document.createElement("div");
        div.className = "rangeText";
        div.title = dID;
        div.style.left = location.X + "px";
        div.style.top = (parseInt(location.Y) + 31) + "px";
        MapImg.appendChild(div);

        // inputrange
        div = document.createElement("input");
        div.className = "inputrange";
        div.title = dID;
        div.type = "number";
        div.value = "40";
        div.min = "40";
        div.style.left = location.X + "px";
        div.style.top = (parseInt(location.Y) + 31) + "px";
        div.addEventListener("change", onChangeInput, false);
        MapImg.appendChild(div);

        // img
        div = document.createElement("div");
        div.className = imgname;
        div.title = dID;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);

        // hitbox
        div = document.createElement("div");
        div.className = "hitbox";
        div.title = dID;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);

        // distanceText
        div = document.createElement("div");
        div.className = "distanceText";
        div.title = dID;
        div.style.left = location.X + "px";
        div.style.top = location.Y + "px";
        MapImg.appendChild(div);
    }

    drawMapImage();
}


// select options
let onChangeSelect = function (select) {
    if (select.id == "missionType") { onChangeSelectMissionType(select); }
    else if (select.id == "mission") { onChangeSelectMission(select); }
    else if (select.id == "quest") { onChangeSelectQuest(select); }
    else if (select.id == "weatherType") { onChangeSelectWeather(select); }
    else if (select.id == "iconStatus") { onChangeSelectAwake(select); }
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
    let missionIDs = Object.keys(missionList);

    switch (value) {

        case "Story": {
            items = missionIDs.filter(mID => {
                return parseInt(mID) < 110000;
            });
        } break;

        case "Tower": { items = missionIDs.filter(mID => { return 110000 <= parseInt(mID) && parseInt(mID) < 200000; }); } break;

        case "Goldrush": {
            items = missionIDs.filter(mID => {
                return missionList[mID].indexOf("ゴールドラッシュ") != -1;
            });
            // sort
            // items.sort((a, b) => { return missionList[a].localeCompare(missionList[b]); })
            items.sort((a, b) => { return parseInt(/\d+/.exec(missionList[a]).toString()) < parseInt(/\d+/.exec(missionList[b]).toString()) ? -1 : 1; })
        } break;

        case "Emergency": {
            items = missionIDs.filter(mID => {
                return 200000 <= parseInt(mID) && parseInt(mID) < 300000 && parseInt(mID) != 200129 &&
                    missionList[mID].indexOf("ゴールドラッシュ") == -1;
            });
            items.sort((a, b) => { return b.localeCompare(a); });   // sort by missionID & reverse 
        } break;
        case "Reproduce": { items = missionIDs.filter(mID => { return 300000 <= parseInt(mID) && parseInt(mID) < 310000 && missionList[mID].indexOf("ゴールドラッシュ") == -1; }); } break;
        case "DailyReproduce": { items = missionIDs.filter(mID => { return 310000 <= parseInt(mID) && parseInt(mID) < 320000 }); } break;

        case "History01": { items = missionIDs.filter(mID => { return (920000 <= parseInt(mID) && parseInt(mID) < 920030) }); } break;
        case "History02": { items = missionIDs.filter(mID => { return (920030 <= parseInt(mID) && parseInt(mID) < 920056) }); } break;
        case "History03": { items = missionIDs.filter(mID => { return (920056 <= parseInt(mID) && parseInt(mID) < 920081) }); } break;
        case "History04": { items = missionIDs.filter(mID => { return (920081 <= parseInt(mID) && parseInt(mID) < 920100) || parseInt(mID) == 920185 }); } break;
        case "History05": { items = missionIDs.filter(mID => { return (920100 <= parseInt(mID) && parseInt(mID) < 920119) }); } break;
        case "History06": { items = missionIDs.filter(mID => { return (920119 <= parseInt(mID) && parseInt(mID) < 920136) || parseInt(mID) == 920186 }); } break;
        case "History07": { items = missionIDs.filter(mID => { return (920136 <= parseInt(mID) && parseInt(mID) < 920153) || parseInt(mID) == 920187 }); } break;
        case "History08": { items = missionIDs.filter(mID => { return (920153 <= parseInt(mID) && parseInt(mID) < 920169) }); } break;
        case "History09": { items = missionIDs.filter(mID => { return (920169 <= parseInt(mID) && parseInt(mID) < 920185) }); } break;
        case "History10": { items = missionIDs.filter(mID => { return (920188 <= parseInt(mID) && parseInt(mID) < 920206) }); } break;
        case "History11": { items = missionIDs.filter(mID => { return (920206 <= parseInt(mID) && parseInt(mID) < 920223) }); } break;
        // case "History12": { items = missionIDs.filter(mID => { return (920223 <= parseInt(mID) && parseInt(mID) < 920223) }); } break;

        case "Special": { items = missionIDs.filter(mID => { return (320000 <= parseInt(mID) && parseInt(mID) < 400000) || missionList[mID].indexOf("異世界") != -1; }); } break;

        case "Subjugation": {
            items = missionIDs.filter(mID => { return (400000 <= parseInt(mID) && parseInt(mID) < 500000) || (930000 <= parseInt(mID) && parseInt(mID) < 950000) });
            // items.sort((a, b) => { return b.localeCompare(a); });   // sort by missionID & reverse 
        } break;
        case "Devil": { items = missionIDs.filter(mID => { return 500000 <= parseInt(mID) && parseInt(mID) < 600000 }); } break;
        case "Raid": { items = missionIDs.filter(mID => { return 900001 < parseInt(mID) && parseInt(mID) < 910000 }); } break;

        case "Daily": { items = missionIDs.filter(mID => { return 700101 <= parseInt(mID) && parseInt(mID) < 700106 }); } break;
        case "Harlem": { items = ["600001"]; } break;

        case "Challenge": { items = ["800001", "900001", "910001", "910002"]; } break;

        case "Debug": {
            missionSelect.options.add(new Option("＝＝ミッション＝＝", ""));
            missionSelect.options.add(new Option("DEBUG", "Debug"));
            return;
        } break;
    }

    // items.sort((a, b) => { return missionList[a].localeCompare(missionList[b]); });   // sort by missionID & reverse 

    // set select items
    missionSelect.options.add(new Option("＝＝ミッション＝＝", ""));
    for (let i in items) {
        let item = items[i];    // mid
        let itemCount = questList.filter(quest => { return quest.missionID == item; }).length;
        if (itemCount == 0) { continue; }

        missionSelect.options.add(new Option(`${missionList[item]} (${itemCount})`, item));
    }
}
let onChangeSelectMission = function (select) {
    // change mission
    let i = select.selectedIndex;
    let value = select.options[i].value;

    // get selected
    let questSelect = document.getElementById("quest");
    questSelect.innerText = null;
    let items = questList.filter(quest => { return quest.missionID == value; });

    // sort
    if (value == "700001") {
        items.sort((a, b) => { return a.questName[0].localeCompare(b.questName[0]); })
    }
    if (value == "300133") {
        // EmergencyMissionQuestList.atb
        let sortList = [4795, 4796, 4798, 4801, 4803, 4806, 4797, 4799, 4800, 4802, 4804, 4805, 4838, 4841, 4840, 4839, 4842, 4843, 4844, 4845, 4846, 4848, 4847, 4850, 4849, 4855, 4852, 4853, 4854, 4851, 4856, 4857, 4858, 4863, 4862, 4866, 4861, 4864, 4860, 4865, 4859, 4871, 4872, 4873, 4868, 4869, 4870, 4867, 4874, 4879, 4876, 4877, 4882, 4875, 4878, 4881, 4880, 4889, 4886, 4883, 4884, 4885, 4888, 4887, 4890, 4895, 4894, 4897, 4892, 4893, 4898, 4891, 4896, 4905, 4902, 4901, 4900, 4903, 4906, 4899, 4904, 4911, 4908, 4913, 4912, 4907, 4910, 4909, 4914, 4921, 4922, 4915, 4920, 4917, 4918, 4919, 4916, 4927, 4926, 4923, 4924, 4925, 4930, 4929, 4928, 4933, 4938, 4934, 4936, 4932, 4937, 4931, 4935, 4939, 4943, 4940, 4944, 4941, 4945, 4942, 4946, 4947, 4954, 4948, 4951, 4949, 4953, 4950, 4952]
        items.sort((a, b) => {
            return a.questID == b.questID ? 0 :
                sortList.indexOf(parseInt(a.questID)) < sortList.indexOf(parseInt(b.questID)) ? -1 : 1;
        })
    }

    // debug 
    if (value == "Debug") {
        items = questList.filter(() => true);
    }

    // set select items
    let str = items.length == 0 ? "＝＝no data＝＝" : "＝＝クエスト＝＝";
    questSelect.options.add(new Option(str, ""));
    for (let i in items) {
        let item = items[i];
        questSelect.options.add(new Option(item.questName, item.id));
        // if (!debulQuestList.includes(item.id)) {
        //     debulQuestList.push(item.id);
        //     console.log(`${debulQuestList.length}/${questList.length}`);
        // }
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
        MapImg.style.backgroundImage = `${bgimg}, ${weatherImg} `;
    }

    onChangeInputRatio(ratioBox);
}
let onChangeSelectAwake = function (select) {
    console.debug("onChangeSelectAwake");
    // get data
    let i = select.selectedIndex;
    let status = select.options[i].value;
    console.log(status)
    // get btns
    let iconbtns = Array.from(document.getElementsByClassName("iconbtn"));
    for (let i in iconbtns) {
        // set icon status
        let id = parseInt(iconbtns[i].alt);
        iconbtns[i].alt = id + status;
        console.log(iconbtns[i].alt)

        // set icon image
        let iconHash = charaData[i].img;
        if (status == "aw")
            iconHash = charaData[i].imgaw || iconHash;
        else if (status == "aw2A")
            iconHash = charaData[i].imgaw2A || charaData[i].imgaw || iconHash;
        else if (status == "aw2B")
            iconHash = charaData[i].imgaw2B || charaData[i].imgaw || iconHash;
        iconbtns[i].src = "./icons/" + iconHash;
    }
}


// event method
let onDragStart = function (event) {
    console.debug("dragStart");

    // save drag image dom id
    event.dataTransfer.setData("imgID", event.target.id);
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
    let img = document.getElementById(event.dataTransfer.getData("imgID"));

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
    else if (select.type == "color" || select.id == "textbox" || select.id == "textSize") { onChangeInputMemobox(select); }
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
    let teSize = document.getElementById("textSize").value + "px";

    box.style.fontSize = teSize;
    box.style.color = teColor;
    box.style.background = bgColor;
    box.style.border = "2px solid " + bdColor;
}
let addMomebox = function () {
    console.debug("addMomebox");
    let box = document.getElementById("textbox");

    text = box.value;
    width = box.offsetWidth + "px";
    fontSize = box.style.fontSize;
    color = box.style.color;
    background = box.style.background;
    border = box.style.border;

    _addMomebox({ text, width, fontSize, color, background, border, left: "30px", top: "30px" });
}
let _addMomebox = function ({ text, width, fontSize, color, background, border, left, top }) {
    console.debug("addMomebox");
    console.debug(text, width, color, background, border, left, top);
    let box = document.getElementById("textbox");

    let div = document.createElement("div");
    div.className = "memo";
    div.draggable = true;
    div.style.paddingLeft = "3px";
    // div.style.paddingTop = "5px";
    div.style.overflow = "hidden";

    div.id = "memo" + iconCount;    // for drag
    div.innerHTML = text;
    div.style.width = width;
    div.style.fontSize = fontSize;
    // div.style.lineHeight = fontSize;
    div.style.color = color;
    div.style.background = background;
    div.style.border = border;
    div.style.left = left;
    div.style.top = top;

    div.addEventListener("dragstart", onDragStart, false);

    MapImg.appendChild(div);
    iconCount++
}
let onClickMemo = function (memo) {
    let box = document.getElementById("textbox");
    let teColor = memo.style.color;
    let bgColor = memo.style.background;
    let bdColor = memo.style.border.replace("2px solid ", "");

    if (/^rgb/.test(teColor)) {
        let temp = teColor.replace(/[^\d,]+/g, "").split(",");
        teColor = "#" +
            parseInt(temp[0]).toString(16).padStart(2, "0") +
            parseInt(temp[1]).toString(16).padStart(2, "0") +
            parseInt(temp[2]).toString(16).padStart(2, "0");
    }
    if (/^rgb/.test(bgColor)) {
        let temp = bgColor.replace(/[^\d,]+/g, "").split(",");
        bgColor = "#" +
            parseInt(temp[0]).toString(16).padStart(2, "0") +
            parseInt(temp[1]).toString(16).padStart(2, "0") +
            parseInt(temp[2]).toString(16).padStart(2, "0");
    }
    if (/^rgb/.test(bdColor)) {
        let temp = bdColor.replace(/[^\d,]+/g, "").split(",");
        bdColor = "#" +
            parseInt(temp[0]).toString(16).padStart(2, "0") +
            parseInt(temp[1]).toString(16).padStart(2, "0") +
            parseInt(temp[2]).toString(16).padStart(2, "0");
    }

    document.getElementById("textcolorbox").value = teColor;
    document.getElementById("bgcolorbox").value = bgColor;
    document.getElementById("outcolorbox").value = bdColor;

    box.value = memo.innerHTML;
    box.style.width = memo.style.width;
    box.style.color = teColor;
    box.style.background = bgColor;
    box.style.border = "2px solid " + bdColor;
}


// location onClick
let nowFocus = "";
let lastFocus = "";
let mobileEvent = {};
let onClickMapimg = function (event) {
    console.debug("onClick", event.target.className, "<=", lastFocus.className);

    let waitInput = (document.querySelector("#mapimg .inputrange:focus, #mapimg .inputrange:hover") != null);
    if (waitInput) return;


    nowFocus = event.target;
    // get memo config
    if (nowFocus.className == "memo") {
        onClickMemo(nowFocus);
    }

    // get move start data
    if (nowFocus.className == "icon" || nowFocus.className == "memo") {
        mobileEvent["imgID"] = nowFocus.id;
        mobileEvent["startX"] = event.clientX;     // Get the horizontal coordinate
        mobileEvent["startY"] = event.clientY;     // Get the vertical coordinate

        lastFocus = nowFocus;
        return;
    }

    // move icon
    if ((lastFocus.className == "icon" || lastFocus.className == "memo") &&
        (nowFocus.className == "location" || nowFocus.className == "goal" || nowFocus.className == "mapimg")) {

        // move icon images
        let img = lastFocus;
        let target = nowFocus;

        let movetion = async function (img, vx, vy, del) {
            let x0 = parseInt(img.style.left);
            let y0 = parseInt(img.style.top);

            for (let angle = 0; angle < 50; ++angle) {
                let d = Math.sin(Math.PI * angle * 0.01);   // 0.0PI => 0.5PI / 0.0 => 1.0
                img.style.left = x0 + Math.round(vx * d) + "px";
                img.style.top = y0 + Math.round(vy * d) + "px";
                await new Promise(resolve => setTimeout(resolve, 9));  // sleep(9ms)
            }

            if (!!del) {
                await new Promise(resolve => setTimeout(resolve, 500));
                MapImg.removeChild(img);
            }
        }

        // change img posion
        if (target.className == "goal") {
            // delete item
            let vx = parseInt(target.style.left) - parseInt(img.style.left);
            let vy = parseInt(target.style.top) - parseInt(img.style.top);
            movetion(img, vx, vy, true);

        } else if (target.className == "location" && img.className == "icon") {
            // move icon to location
            let vx = parseInt(target.style.left) - parseInt(img.style.left);
            let vy = parseInt(target.style.top) - parseInt(img.style.top);
            movetion(img, vx, vy);

        } else {
            // move item to any position
            let startX = mobileEvent["startX"];
            let startY = mobileEvent["startY"];
            let endX = event.clientX;
            let endY = event.clientY;
            let vx = endX - startX;
            let vy = endY - startY;
            movetion(img, vx, vy);
        }

        lastFocus = nowFocus;
        return;
    }

    if (nowFocus.className == "mapimg" || nowFocus.className == "location") {
        drawMapImage();
    }

}
// draw map image
let drawMapImage = function () {
    // get all location
    let locations = Array.from(MapImg.getElementsByClassName("location"));
    for (let i in locations) {
        let location = locations[i];
        let dID = locations[i].id;

        // get element
        if (!dID) console.log(location);
        let range = document.querySelector(`div.range[title = ${dID}]`);
        let rangeText = document.querySelector(`div.rangeText[title = ${dID}]`);
        let inputrange = document.querySelector(`input.inputrange[title = ${dID}]`);
        let hitbox = document.querySelector(`div.hitbox[title = ${dID}]`);
        let distanceText = document.querySelector(`div.distanceText[title = ${dID}]`);

        // get data
        let type = /[^\d]+/.exec(dID).toString();
        let rangeData = parseInt(inputrange.value);
        let ratioData = parseFloat(document.getElementById("rangeRatio").value);

        // draw range circle size
        range.style.width = Math.round(rangeData * ratioData * 1.5) + "px";
        range.style.height = Math.round(rangeData * ratioData * 1.5) + "px";

        // set rangeText
        // rangeText.innerText = (ratioData == 1.0) ? rangeData : `${ rangeData } x ${ ratioData.toFixed(2) } = \n${ Math.round(rangeData * ratioData) } `;
        rangeText.innerText = (ratioData == 1.0) ? rangeData : `${rangeData} x ${ratioData.toFixed(2)} `;

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

                let nowFocusRange = parseInt(document.querySelector(`input.inputrange[title = ${center.id}]`).value);
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
let saveFile = function (name, data) {
    // download file
    function fake_click(obj) {
        var ev = document.createEvent("MouseEvents");
        ev.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        obj.dispatchEvent(ev);
    }
    let urlObject = window.URL || window.webkitURL || window;
    let downloadData = new Blob([data]);
    let save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
    save_link.href = urlObject.createObjectURL(downloadData);
    save_link.download = name;
    fake_click(save_link);
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
