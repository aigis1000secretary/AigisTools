const fs = require("fs");
const path = require("path");
const child_process = require('child_process');
global.sleep = async function (ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }
console.json = async function (str) { return console.log(JSON.stringify(str, null, 4)); }

// get local file list
let getFileList = function (dirPath) {
    let result = [];
    let apiResult = fs.readdirSync(dirPath);
    for (let i in apiResult) {
        if (fs.lstatSync(dirPath + "/" + apiResult[i]).isDirectory()) {
            result = result.concat(getFileList(dirPath + "/" + apiResult[i]));
        } else {
            result.push(dirPath + "/" + apiResult[i]);
        }
    }
    return result;
};

// rawToJson
const rawToJson = function (rawPath) {
    let rawData = fs.readFileSync(rawPath).toString().trim().split("\n");
    let result = [];
    let i = -1;

    // readline
    while (true) {
        let line = rawData.shift();
        if (!line) break;   // EOF

        if (/\d+\/\d+\s+[\s\S]+Level/.test(line)) {
            i++;
            result[i] = {};
            result[i].id = /\d+\/\d+/.exec(line).toString();
            result[i].name = /\d\s+[\s\S]+Level/.exec(line).toString().replace(/^\d/, "").replace(/Level$/, "").trim();
            result[i].locationList = [];
            continue;
        }
        // get data
        let keys = ["map", "location", "life", "startUP", "unitLimit"];
        while (/[A-Za-z]+=[\d_]+/.test(line)) {
            let str = /[A-Za-z]+=[\d_]+/.exec(line).toString();
            line = line.replace(str, "");

            let j = keys.indexOf(/[A-Za-z]+/.exec(str).toString());
            if (j != -1) {
                result[i][keys[j]] = /[\d_]+/.exec(str).toString();
            }
        }
    }
    return result;
}

const main = async function () {
    // check resources
    let resources = "../AigisTools/out/files";
    if (!fs.existsSync(resources)) { console.log("!fs.existsSync(resources)"); return; }

    // raw filelist
    let filesTxt = resources + "/files.txt";

    // waiting file list
    while (true) {
        if (fs.existsSync(filesTxt)) { break; }
        console.log("waiting raw files list... ", filesTxt);
        await sleep(1000);
    }

    // filter resource name
    let filelist = fs.readFileSync(filesTxt).toString().trim().split("\n");
    for (let i = 0; i < filelist.length; ++i) {
        let filename = filelist[i].substr(89);
        if (!/^emc/i.test(filename) && (
            // /Map\d+/i.test(filename) ||
            /MissionQuestList.atb/i.test(filename) ||
            /MissionConfig.atb/i.test(filename) ||
            /QuestNameText.atb/i.test(filename)
        )) {
            if (!fs.existsSync(resources + "/" + filename)) // skip exist
            {
                filelist[i] = filename;
                continue;
            }
        }
        filelist[i] = "";
    }
    filelist = filelist.filter((file) => { return (file != ""); })
    // download resource file
    for (let i in filelist) {
        let file = filelist[i];
        console.log(child_process.execSync('cd ../AigisTools/&get.bat ' + file).toString().trim());
    }
    // get resource list
    let resourceList = getFileList(resources);
    let missionConfig = {};
    let questList = [];
    // get mission name raw
    let rawtxt = resourceList.filter((file) => { return (/MissionConfig.atb[\S]+\.txt$/i.test(file)); });
    for (let i = 0; i < rawtxt.length; ++i) { rawtxt[i] = fs.readFileSync(rawtxt[i]).toString(); }
    rawtxt = rawtxt.join("\n").split("\n");
    // read mission-name list
    for (let i in rawtxt) {
        let string = rawtxt[i].trim();
        if (/^\d+\s+\"[^\"]+\"/.test(string)) {
            // *MissionConfig.atb
            string = /^\d+\s+\"[^\"]+\"/.exec(string).toString();
            let missionID = /^\d+/.exec(string).toString();
            let name = /\"[^\"]+\"/.exec(string).toString().replace(/\"/g, "");
            missionConfig[missionID] = name;
        } else if (/^\d+\s+\d+\s+\"[^\"]+\"/.test(string)) {
            // DailyReproduceMissionConfig.atb
            string = /^\d+\s+\d+\s+\"[^\"]+\"/.exec(string).toString();
            let missionID = /^\d+/.exec(string).toString();
            let name = /\s+\d+\s+/.exec(string).toString().trim();
            missionConfig[missionID] = name;

            let qIds = /\"[^\"]+\"/.exec(string).toString().replace(/\"/g, "").split(",");
            for (let j in qIds) {
                let qId = missionID + "/" + qIds[j];
                if (questList.indexOf(qId) == -1) { questList.push(qId); }
            }

        } else if (string != "" && !/MissionID/.test(string)) { console.log("[ERROR] " + string); }
    }
    // get quest list raw
    rawtxt = resourceList.filter((file) => { return (/MissionQuestList.atb[\S]+\.txt$/i.test(file)); });
    for (let i = 0; i < rawtxt.length; ++i) { rawtxt[i] = fs.readFileSync(rawtxt[i]).toString(); }
    rawtxt = rawtxt.join("\n").split("\n");
    // read mission-quest list
    for (let i in rawtxt) {
        let string = rawtxt[i].trim();
        if (/^\d+\s+\d+/.test(string)) {
            string = /^\d+\s+\d+/.exec(string).toString();
            let qId = string.trim().replace(/\s+/, "/")
            if (questList.indexOf(qId) == -1) { questList.push(qId); }
        } else if (string != "" && !/MissionID/.test(string)) { console.log("[ERROR] " + string); }
    }
    questList.sort();

    // manual set mission name
    {
        missionConfig["100001"] = "第一章　王都脱出";
        missionConfig["100002"] = "第二章　王城奪還";
        missionConfig["100003"] = "第三章　熱砂の砂漠";
        missionConfig["100004"] = "第四章　東の国";
        missionConfig["100005"] = "第五章　魔法都市";
        missionConfig["100006"] = "第六章　密林の戦い";
        missionConfig["100007"] = "第七章　魔の都";
        missionConfig["100008"] = "第八章　魔神の体内";
        missionConfig["100009"] = "第九章　鋼の都";

        missionConfig["310001"] = "魔女を救え！";
        missionConfig["310002"] = "魔女の娘";
        missionConfig["310003"] = "闇の忍者軍団";
        missionConfig["310004"] = "鬼を宿す剣士";
        missionConfig["310005"] = "聖戦士の挑戦";
        missionConfig["310006"] = "影の狙撃手";
        missionConfig["310007"] = "魔人の宿命";
        missionConfig["310008"] = "戦乙女の契約";
        missionConfig["310009"] = "暗黒騎士団の脅威";
        missionConfig["310010"] = "暗黒舞踏会";
        missionConfig["310011"] = "魔術の秘法";
        missionConfig["310012"] = "アンナと雪の美女";
        missionConfig["310013"] = "山賊王への道";
        missionConfig["310014"] = "竜騎士の誓い";
        missionConfig["310015"] = "錬金術士と賢者の石";
        missionConfig["310016"] = "モンクの修行場";
        missionConfig["310017"] = "聖鎚闘士の挑戦";
        missionConfig["310018"] = "鬼招きの巫女";
        missionConfig["310019"] = "砲科学校の訓練生";
        missionConfig["310020"] = "囚われの魔法剣士";
        missionConfig["310021"] = "死霊の船と提督の決意";
        missionConfig["310022"] = "帝国の天馬騎士";
        missionConfig["310023"] = "暗黒騎士団と狙われた癒し手";
        missionConfig["310024"] = "獣人の誇り";
        missionConfig["310025"] = "白の帝国と偽りの都市";
        missionConfig["310026"] = "堕天使の封印";
        missionConfig["310027"] = "暗黒騎士団と聖夜の贈り物";
        missionConfig["310028"] = "古代の機甲兵";
        missionConfig["310029"] = "呪術師と妖魔の女王";
        missionConfig["310030"] = "私掠船長と魔の海域";
        missionConfig["310031"] = "ヴァンパイアと聖なる復讐者";
        missionConfig["310032"] = "妖魔の女王と戦術の天才";
        missionConfig["310033"] = "魔界蟻と囚われた男達";
        missionConfig["310034"] = "天使たちの陰謀";
        missionConfig["310035"] = "魔蝿の森と呪われた番人";
        missionConfig["310036"] = "失われた竜の島";
        missionConfig["310037"] = "帝国神官の帰還";
        missionConfig["310038"] = "闇の組織と狙われた王子";
        missionConfig["310039"] = "オーク格闘家の王子軍入門";
        missionConfig["310040"] = "王子軍の夏祭り";
        missionConfig["310041"] = "カリオペと恐怖の夜";
        missionConfig["310042"] = "夢現のダークプリースト";
        missionConfig["310043"] = "魔王軍の胎動";
        missionConfig["310044"] = "彷徨える守護の盾";
        missionConfig["310045"] = "渚に咲きし水着騎兵";
        missionConfig["310046"] = "カボチャの国の魔法使い";
        missionConfig["310047"] = "星に祈りし聖夜の癒し手";
        missionConfig["310048"] = "学園騎兵科の新入生";
        missionConfig["310049"] = "白き獣人と闇の組織";
        missionConfig["310050"] = "砂浜を駆ける魔術師";
        missionConfig["310051"] = "密林のハロウィンパーティー";
    }

    // get quest data    
    console.log("output get_xmlfile_missions");
    let QxZpjdfVRaw = child_process.execSync('cd ../AigisTools/&do get_xmlfile_missions.lua').toString().trim().replace(/nil/g, '"nil "');
    let QxZpjdfV = [];
    try { QxZpjdfV = JSON.parse(QxZpjdfVRaw); }
    catch (e) { QxZpjdfV = eval("(" + QxZpjdfVRaw + ")"); }

    // set quest data
    // console.log("set quest data");
    for (let i = 0; i < questList.length; ++i) {
        // get id
        let id = questList[i].toString();
        let name = id;
        let missionId = /^\d+/.exec(id).toString();
        let questId = /\d+$/.exec(id).toString();

        // get quest data
        let questRaw = QxZpjdfV.filter((quest) => { return quest.QuestID == questId; })
        if (questRaw.length != 1) { continue; }
        else questRaw = questRaw[0];

        // tower mapNo
        let map = questRaw.MapNo.toString().padStart(4, "0");
        if (missionId == "110001") { map = "110001_" + map; }

        questList[i] = {
            id,
            name,
            locationList: [],
            missionId,
            questId,
            map,
            location: questRaw.LocationNo.toString().padStart(2, "0"),
            life: questRaw.defHP.toString(),
            startUP: questRaw.defAP.toString(),
            unitLimit: questRaw.Capacity.toString()
        };
    }

    // set quest name
    // console.log("set quest name");
    rawtxt = resourceList.filter((file) => { return (/QuestNameText\d+.atb[\S]+\.txt$/i.test(file)); });
    for (let i in rawtxt) {
        let file = rawtxt[i];
        let missionId = /\d+/i.exec(file).toString();

        // get quest by missionid
        let quests = questList.filter((quest) => { return quest.missionId == missionId; });
        if (quests.length == 0 && missionId[0] == 2) {
            missionId = (parseInt(missionId) + 100000).toString();
            quests = questList.filter((quest) => { return quest.missionId == missionId; });
        }

        // get name list
        let names = fs.readFileSync(file).toString().trim().split("\n").filter((line) => { return /\"[^\']+\"/.test(line); });

        // if (names.length >= questCount && questCount != 0) {
        if (quests.length > 0) {
            for (let j in quests) {
                let name = names[j];
                if (!name) break;
                quests[j].name = name.trim().replace(/^\"|\"$/g, "");
            }
        }
    }

    // copy map data
    // console.log("copy map data");
    for (let i in questList) {
        let quest = questList[i];
        if (!quest.map) continue;

        let filename = "Map" + quest.map;
        let _location = "Location" + quest.location;
        let locationTxt = resourceList.find((file) => { return (file.indexOf(filename) != -1 && file.indexOf(_location) != -1 && /Location[\S]+\.txt$/i.test(file)); });
        // Location.atb
        let locations = fs.readFileSync(locationTxt).toString().replace(/ [ ]+/g, " ").split("\n");
        for (let j in locations) {
            let locals = locations[j].trim().split(" ");
            if (!/\d/.test(locals[0])) { continue; }
            let obj = { ObjectID: locals[0], X: locals[1], Y: locals[2], _Command: locals[3] };
            quest.locationList.push(obj);
        }
    }

    // output file 
    console.log("output missionConfig.js")
    fs.writeFileSync("./html/missionConfig.js", "let missionConfig = " + JSON.stringify(missionConfig, null, 4));

    console.log("output questList.js")
    fs.writeFileSync("./html/questList.js", "let questList = " + JSON.stringify(questList, null, 4));

};
main().catch(console.log);



