

let bodyOnload = function () {
    questList.sort((a, b) => { return a.id.localeCompare(b.id); })

    // let groupList = [];
    // for (let i in missionData) {
    //     let mission = missionData[i];
    //     let groupId = /^\d+/.exec(mission.id).toString();
    //     if (groupList.indexOf(groupId) == -1) groupList.push(groupId);
    // }

    // missionGroup = missionGroup.filter();
    // let keys = Object.keys(missionGroup);
    // for (let i in keys) {
    //     let key = keys[i];
    //     if (groupList.indexOf(key) == -1) delete missionGroup[key];
    // }
    // console.log(JSON.stringify(groupList, null, 4));
    // console.log(JSON.stringify(keys, null, 4));
    // console.log(JSON.stringify(missionGroup, null, 4));



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
        let i = select.selectedIndex;
        let value = select.options[i].value;

        let missionSelect = document.getElementsByClassName("mission")[0];
        missionSelect.innerText = null;
        let items = [];
        let missionIds = Object.keys(missionConfig);

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
                    return missionConfig[mId].indexOf("ゴールドラッシュ") != -1;
                });
            } break;

            case "Emergency": {
                items = missionIds.filter((mId) => {
                    return 200000 <= parseInt(mId) && parseInt(mId) < 300000 &&
                        missionConfig[mId].indexOf("ゴールドラッシュ") == -1 &&
                        missionConfig[mId].indexOf("異世界") == -1;
                });
                items.sort((a, b) => { return b.localeCompare(a); })
            } break;
            case "Reproduce": {
                items = missionIds.filter((mId) => {
                    return 300000 <= parseInt(mId) && parseInt(mId) < 310000 &&
                        missionConfig[mId].indexOf("ゴールドラッシュ") == -1 &&
                        missionConfig[mId].indexOf("異世界") == -1;
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
                        missionConfig[mId].indexOf("異世界") != -1;
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

        // 
        missionSelect.options.add(new Option("＝＝ミッション＝＝", ""));
        for (let i in items) {
            let item = items[i];
            missionSelect.options.add(new Option(missionConfig[item], item));
        }
    } else if (select.className == "mission") {
        let i = select.selectedIndex;
        let value = select.options[i].value;

        let questSelect = document.getElementsByClassName("quest")[0];
        questSelect.innerText = null;
        let items = questList.filter((quest) => { return quest.missionId == value; });

        // sort
        if (value == "700001") {
            items.sort((a, b) => { return a.questTitle[0].localeCompare(b.questTitle[0]); })
        }

        let str = items.length == 0 ? "＝＝no data＝＝" : "＝＝クエスト＝＝ (" + items.length + ")"
        questSelect.options.add(new Option(str, ""));
        for (let i in items) {
            let item = items[i];
            questSelect.options.add(new Option(item.questTitle, item.id));
        }
    } else if (select.className == "quest") {
        let i = select.selectedIndex;
        let value = select.options[i].value;
        // get quest
        let quest = questList.find((quest) => { return quest.id == value; });

        let mapimg = document.getElementsByClassName("mapimg")[0];
        mapimg.innerHTML = null;
        mapimg.style = "background-image:url(../../AigisTools/out/files/Map" + quest.map + ".png);";

        for (let i in quest.locationList) {
            let local = quest.locationList[i];
            let div = document.createElement("div");
            div.className = local.ObjectID == 0 ? "goal" :
                local.ObjectID < 300 ? "near" : "afar";
            div.style = "left: " + local.X + "px; top: " + local.Y + "px;";

            div.addEventListener("ondrop", drop, false);
            div.addEventListener("ondragover", allowDrop, false);

            mapimg.appendChild(div);
        }
    }
}

// mapimg method
function dragStart(event) {
    console.log("dragStart");

    // save drag image dom id
    event.dataTransfer.setData("imgId", event.target.id);

    // set map alpha 0.5
    document.getElementsByClassName("mapimg")[0].title = "alpha";
}
function allowDrop(event) {
    // console.log("allowDrop");
    event.preventDefault();
}
function drop(event) {
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