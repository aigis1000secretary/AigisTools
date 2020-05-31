

let bodyOnload = function () {
    questList.sort((a, b) => { return a.id.localeCompare(b.id); })
    // console.log("bodyOnload");

    let typeSelect = document.getElementsByClassName("missionType")[0];

    // typeSelect.options.add(new Option("＝＝分類＝＝", ""));
    typeSelect.options.add(new Option("ストーリーミッション", "Story"));
    typeSelect.options.add(new Option("英傑の塔", "Tower"));
    typeSelect.options.add(new Option("曜日ミッション", "Daily"));

    typeSelect.options.add(new Option("緊急ミッション", "Emergency"));
    typeSelect.options.add(new Option("デイリー復刻", "DailyReproduce"));

    typeSelect.options.add(new Option("魔神降臨", "Devil"));
    typeSelect.options.add(new Option("神獣降臨", "Raid"));

    typeSelect.options.add(new Option("交流クエスト", "Harlem"));
    typeSelect.options.add(new Option("戦術指南/チャレンジクエスト", "Challenge"));

    typeSelect.options.add(new Option("ゴールドラッシュ", "Goldrush"));
    typeSelect.options.add(new Option("復刻ミッション", "Reproduce"));
    typeSelect.options.add(new Option("大討伐", "Subjugation"));
    typeSelect.options.add(new Option("特別ミッション", "Special"));
}

// select options
function onChange(select) {
    if (select.className == "missionType") {
        // change type
        let i = select.selectedIndex;
        let value = select.options[i].value;

        // get selected
        let missionSelect = document.getElementsByClassName("mission")[0];
        missionSelect.innerText = null;
        let items = [];
        let missionIds = Object.keys(missionNameList);

        switch (value) {

            case "Story": {
                items = missionIds.filter((mId) => {
                    return parseInt(mId) < 110000;
                });
            } break;

            case "Tower": {
                items = missionIds.filter((mId) => {
                    return 110000 <= parseInt(mId) && parseInt(mId) < 200000;
                });
            } break;

            case "Goldrush": {
                items = missionIds.filter((mId) => {
                    return missionNameList[mId].indexOf("ゴールドラッシュ") != -1;
                });
            } break;

            case "Emergency": {
                items = missionIds.filter((mId) => {
                    return 200000 <= parseInt(mId) && parseInt(mId) < 300000 &&
                        missionNameList[mId].indexOf("ゴールドラッシュ") == -1 &&
                        missionNameList[mId].indexOf("異世界") == -1;
                });
                items.sort((a, b) => { return b.localeCompare(a); })
            } break;
            case "Reproduce": {
                items = missionIds.filter((mId) => {
                    return 300000 <= parseInt(mId) && parseInt(mId) < 310000 &&
                        missionNameList[mId].indexOf("ゴールドラッシュ") == -1 &&
                        missionNameList[mId].indexOf("異世界") == -1;
                });
            } break;
            case "DailyReproduce": {
                items = missionIds.filter((mId) => {
                    return 310000 <= parseInt(mId) && parseInt(mId) < 320000
                });
            } break;
            case "Special": {
                items = missionIds.filter((mId) => {
                    return 320000 <= parseInt(mId) && parseInt(mId) < 400000 ||
                        missionNameList[mId].indexOf("異世界") != -1;
                });
            } break;

            case "Subjugation": {
                items = missionIds.filter((mId) => {
                    return 400000 <= parseInt(mId) && parseInt(mId) < 500000
                });
            } break;
            case "Devil": {
                items = missionIds.filter((mId) => {
                    return 500000 <= parseInt(mId) && parseInt(mId) < 600000
                });
            } break;
            case "Raid": {
                items = missionIds.filter((mId) => {
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

    } else if (select.className == "mission") {
        // change mission
        let i = select.selectedIndex;
        let value = select.options[i].value;

        // get selected
        let questSelect = document.getElementsByClassName("quest")[0];
        questSelect.innerText = null;
        let items = questList.filter((quest) => { return quest.missionId == value; });

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

    } else if (select.className == "quest") {
        // change quest
        let i = select.selectedIndex;
        let value = select.options[i].value;

        // get selected
        let quest = questList.find((quest) => { return quest.id == value; });

        // clear map image
        let mapimg = document.getElementsByClassName("mapimg")[0];
        mapimg.innerHTML = null;

        // set range element
        let range = document.createElement("div");
        range.className = "range";
        range.style.visibility = "hidden";
        let radius = document.getElementsByClassName("rangebox")[0].children[0].value;
        range.style.width = (radius * 1.5) + "px";
        range.style.height = (radius * 1.5) + "px";
        mapimg.appendChild(range);
        // range.style.visibility = "visible";

        // get bg map image
        let md5 = hashList["Map" + quest.map + ".png"];
        mapimg.style = "background-image:url(./maps/" + md5 + ");";

        // get location data
        for (let i in quest.locationList) {
            let local = quest.locationList[i];
            let div = document.createElement("div");

            if (local.ObjectID == 0) div.className = "goal";
            else if (100 <= local.ObjectID && local.ObjectID < 200) continue;
            else if (200 <= local.ObjectID && local.ObjectID < 300) div.className = "near";
            else if (300 <= local.ObjectID && local.ObjectID < 400) div.className = "afar";
            div.style = "left: " + local.X + "px; top: " + local.Y + "px;";

            div.addEventListener("ondrop", onDrop, false);
            div.addEventListener("ondragover", onDragOver, false);
            div.addEventListener("click", onClick, false);

            mapimg.appendChild(div);
        }
    }
}
function onChangeRange(select) {
    if (select.className != "rangebox") { return; }
    // change type
    let radius = select.value;
    
    // set range element
    let range = document.getElementsByClassName("range")[0];
    if (!range) { return; }

    range.style.width = (radius * 1.5) + "px";
    range.style.height = (radius * 1.5) + "px";
}

// mapimg method
function onDragStart(event) {
    console.log("dragStart");

    // save drag image dom id
    event.dataTransfer.setData("imgId", event.target.id);

    // set map alpha 0.5
    document.getElementsByClassName("mapimg")[0].title = "alpha";
}
function onDragOver(event) {
    // console.log("allowDrop");
    event.preventDefault();
}
function onDrop(event) {
    // console.log("drop");
    event.preventDefault();

    // get mapimg
    let mapimg = document.getElementsByClassName("mapimg")[0];

    // set map alpha 0.0
    mapimg.title = "";

    // get drop area
    let target = event.target;
    let className = target.className;

    // get drag image
    let imgId = event.dataTransfer.getData("imgId");
    let img = document.getElementById(imgId);

    if (className == "goal") {
        mapimg.removeChild(img);
    } else if (className == "near" || className == "afar") {
        img.style.left = target.style.left;
        img.style.top = target.style.top;
    } else if (className == "mapimg") {
        console.log(event)
        img.style.left = event.offsetX + "px";
        img.style.top = event.offsetY + "px";
    }
}
function onClick(event) {

    // set range element
    let range = document.getElementsByClassName("range")[0];
    if (!range) { return; }

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
    } else {
        range.style.visibility = "hidden";
    }
}
