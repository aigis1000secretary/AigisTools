const fs = require("fs");
// const path = require("path");
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

    // filter resource name some we need
    let filelist = fs.readFileSync(filesTxt).toString().trim().split("\n");
    for (let i = 0; i < filelist.length; ++i) {
        let filename = filelist[i].substr(89);
        if (!/^emc/i.test(filename) && (
            /Map\d+/i.test(filename) ||
            /MissionQuestList.atb/i.test(filename) ||
            /MissionConfig.atb/i.test(filename) ||
            /QuestNameText\d*.atb/i.test(filename)
        )) {
            if (/Mission\S+.atb/i.test(filename) || !fs.existsSync(resources + "/" + filename)) // skip exist
            {
                filelist[i] = filename;
                continue;
            }
        }
        filelist[i] = "";
    }
    filelist.sort();
    filelist = filelist.filter((file) => { return (file != ""); })
    // download resource file
    for (let i in filelist) {
        let file = filelist[i];
        console.log(child_process.execSync("cd ../AigisTools/&get.bat " + file).toString().trim());
    }

    // get resource list
    let resourceList = getFileList(resources);
    let missionNameList = {};
    let missionQuestList = [];
    let questList = [];

    // get mission<=>name raw
    let rawtxt = resourceList.filter((file) => { return (/MissionConfig.atb[\S]+\.txt$/i.test(file)); });
    for (let i = 0; i < rawtxt.length; ++i) { rawtxt[i] = fs.readFileSync(rawtxt[i]).toString(); }
    rawtxt = rawtxt.join("\n").split("\n");
    // read mission<=>name list
    for (let i in rawtxt) {
        let string = rawtxt[i].trim();
        if (/^\d+\s+\"[^\"]+\"/.test(string)) {
            // *MissionConfig.atb
            string = /^\d+\s+\"[^\"]+\"/.exec(string).toString();
            let missionID = /^\d+/.exec(string).toString();
            let name = /\"[^\"]+\"/.exec(string).toString().replace(/\"/g, "");
            missionNameList[missionID] = name;
        } else if (/^\d+\s+\d+\s+\"[^\"]+\"/.test(string)) {
            // DailyReproduceMissionConfig.atb
            string = /^\d+\s+\d+\s+\"[^\"]+\"/.exec(string).toString();
            let missionID = /^\d+/.exec(string).toString();
            let name = /\s+\d+\s+/.exec(string).toString().trim();
            missionNameList[missionID] = name;

            let qIds = /\"[^\"]+\"/.exec(string).toString().replace(/\"/g, "").split(",");
            for (let j in qIds) {
                let qId = missionID + "/" + qIds[j];
                if (missionQuestList.indexOf(qId) == -1) { missionQuestList.push(qId); }
            }

        } else if (string != "" && !/MissionID/.test(string)) { console.log("[ERROR] " + string); }
    }

    // get mission<=>quest raw
    rawtxt = resourceList.filter((file) => { return (/MissionQuestList.atb[\S]+\.txt$/i.test(file)); });
    for (let i = 0; i < rawtxt.length; ++i) { rawtxt[i] = fs.readFileSync(rawtxt[i]).toString(); }
    rawtxt = rawtxt.join("\n").split("\n");
    // read mission<=>quest list
    for (let i in rawtxt) {
        let string = rawtxt[i].trim();
        if (/^\d+\s+\d+/.test(string)) {
            string = /^\d+\s+\d+/.exec(string).toString();
            let qId = string.trim().replace(/\s+/, "/")
            if (missionQuestList.indexOf(qId) == -1) { missionQuestList.push(qId); }
        } else if (string != "" && !/MissionID/.test(string)) { console.log("[ERROR] " + string); }
    }
    // manual set mission name
    {
        missionNameList["100001"] = "第一章　王都脱出";
        missionNameList["100002"] = "第二章　王城奪還";
        missionNameList["100003"] = "第三章　熱砂の砂漠";
        missionNameList["100004"] = "第四章　東の国";
        missionNameList["100005"] = "第五章　魔法都市";
        missionNameList["100006"] = "第六章　密林の戦い";
        missionNameList["100007"] = "第七章　魔の都";
        missionNameList["100008"] = "第八章　魔神の体内";
        missionNameList["100009"] = "第九章　鋼の都";

        missionNameList["310001"] = "魔女を救え！";
        missionNameList["310002"] = "魔女の娘";
        missionNameList["310003"] = "聖戦士の挑戦";
        missionNameList["310004"] = "魔術の秘法";
        missionNameList["310005"] = "鬼招きの巫女";
        missionNameList["310006"] = "暗黒騎士団の脅威";
        missionNameList["310007"] = "モンクの修行場";
        missionNameList["310008"] = "囚われの魔法剣士";
        missionNameList["310009"] = "獣人の誇り";
        missionNameList["310010"] = "堕天使の封印";
        missionNameList["310011"] = "古代の機甲兵";
        missionNameList["310012"] = "闇の忍者軍団";
        missionNameList["310013"] = "鬼を宿す剣士";
        missionNameList["310014"] = "影の狙撃手";
        missionNameList["310015"] = "魔人の宿命";
        missionNameList["310016"] = "暗黒舞踏会";
        missionNameList["310017"] = "アンナと雪の美女";
        missionNameList["310018"] = "戦乙女の契約";
        missionNameList["310019"] = "山賊王への道";
        missionNameList["310020"] = "密林のハロウィンパーティー";
        missionNameList["310021"] = "錬金術士と賢者の石";
        missionNameList["310022"] = "聖鎚闘士の挑戦";
        missionNameList["310023"] = "闇の組織と狙われた王子";
        missionNameList["310024"] = "死霊の船と提督の決意";
        missionNameList["310025"] = "帝国の天馬騎士";
        missionNameList["310026"] = "暗黒騎士団と狙われた癒し手";
        missionNameList["310027"] = "白の帝国と偽りの都市";
        missionNameList["310028"] = "密林のハロウィンパーティー";
        missionNameList["310029"] = "呪術師と妖魔の女王";
        missionNameList["310030"] = "私掠船長と魔の海域";
        missionNameList["310031"] = "ヴァンパイアと聖なる復讐者";
        missionNameList["310032"] = "妖魔の女王と戦術の天才";
        missionNameList["310033"] = "魔界蟻と囚われた男達";
        missionNameList["310034"] = "天使たちの陰謀";
        missionNameList["310035"] = "魔蝿の森と呪われた番人";
        missionNameList["310036"] = "失われた竜の島";
        missionNameList["310037"] = "帝国神官の帰還";
        missionNameList["310038"] = "闇の組織と狙われた王子";
        missionNameList["310039"] = "オーク格闘家の王子軍入門";
        missionNameList["310040"] = "王子軍の夏祭り";
        missionNameList["310041"] = "カリオペと恐怖の夜";
        missionNameList["310042"] = "夢現のダークプリースト";
        missionNameList["310043"] = "魔王軍の胎動";
        missionNameList["310044"] = "彷徨える守護の盾";
        missionNameList["310045"] = "渚に咲きし水着騎兵";
        missionNameList["310046"] = "カボチャの国の魔法使い";
        missionNameList["310047"] = "星に祈りし聖夜の癒し手";
        missionNameList["310048"] = "学園騎兵科の新入生";
        missionNameList["310049"] = "白き獣人と闇の組織";
        missionNameList["310050"] = "砂浜を駆ける魔術師";
        missionNameList["310051"] = "密林のハロウィンパーティー";
    }

    // get quest raw data
    console.log("output get_xmlfile_missions");
    let QxZpjdfVRaw = child_process.execSync('cd ../AigisTools/&do get_xmlfile_missions.lua').toString().trim().replace(/nil/g, '"nil "');
    let QxZpjdfV = [];
    try { QxZpjdfV = JSON.parse(QxZpjdfVRaw); }
    catch (e) { QxZpjdfV = eval("(" + QxZpjdfVRaw + ")"); }

    // set quest data
    for (let i in QxZpjdfV) {
        let questRaw = QxZpjdfV[i];

        let id = "";
        let questId = questRaw.QuestID.toString();
        let questTitle = questRaw.QuestTitle;
        let missionId = "";
        let missionTitle = "";
        let map = questRaw.MapNo.toString().padStart(4, "0");;
        let location = questRaw.LocationNo.toString().padStart(2, "0");;
        let life = questRaw.defHP.toString();
        let startUP = questRaw.defAP.toString();
        let unitLimit = questRaw.Capacity.toString();
        let locationList = [];

        // get mission id & check mission id valid
        let questIds = missionQuestList.filter((fullId) => {
            let qId = /\d+$/.exec(fullId).toString();
            let mid = /^\d+/.exec(fullId).toString();
            return qId == questId && missionNameList[mid];
        });
        if (questIds.length != 1) {
            console.log("[ERROR] questId " + questId + " cant found mission id from <missionQuestList [" + questIds.length + "]>!");
            continue;
        }
        missionId = /^\d+/.exec(questIds[0]).toString();

        // get mission title
        missionTitle = missionNameList[missionId];
        if (!missionTitle) {
            console.log("[ERROR] missionId " + missionId + " cant found mission title from <missionNameList>!");
            continue;
        }

        // get quest title
        let _NameText000000atb = "QuestNameText" + missionId + ".atb";
        let nameTextTxt = resourceList.find((file) => { return (file.indexOf(_NameText000000atb) != -1 && /\.txt$/i.test(file)); });
        if (!nameTextTxt) {
            console.log("[ERROR] " + _NameText000000atb + "/ALTB_gdtx.txt not found !");
            continue;
        }
        // QuestNameText000000.atb/ALTB_gdtx.txt
        let nameList = fs.readFileSync(nameTextTxt).toString().replace(/ [ ]+/g, " ").split("\n");
        nameList = nameList.filter((name) => { return /\"[^\"]+\"/.test(name); });
        if (!nameList[questTitle]) {
            console.log("[ERROR] questId " + questId + " cant found quest title list from <QuestNameText~.atb>!");

            console.log(questTitle, typeof (questTitle), nameList[questTitle], nameList.length);
            console.log("");

            continue;
        }
        questTitle = nameList[questTitle].trim().replace(/\"/g, "");

        // pad data
        id = missionId + "/" + questId;
        if (missionId == "110001") { map = "110001_" + map; }

        // copy map loacltion data
        let _map0000aar = "Map" + map + ".aar";
        let _location00atb = "Location" + location + ".atb";
        let locationTxt = resourceList.find((file) => { return (file.indexOf(_map0000aar) != -1 && file.indexOf(_location00atb) != -1 && /\.txt$/i.test(file)); });
        if (!locationTxt) {
            console.log("[ERROR] " + _map0000aar + "/" + _location00atb + "/ALTB_loca.txt not found !");
            continue;
        }
        // Location.atb/ALTB_loca.txt
        let locations = fs.readFileSync(locationTxt).toString().replace(/ [ ]+/g, " ").split("\n");
        for (let j in locations) {
            let locals = locations[j].trim().split(" ");
            if (!/\d/.test(locals[0])) { continue; }    // <ObjectID   X   Y _Command>
            let obj = { ObjectID: locals[0], X: locals[1], Y: locals[2], _Command: locals[3] };
            locationList.push(obj);
        }

        // build quest data
        let quest = {
            id,
            questId, questTitle,
            missionId, missionTitle,
            map, location,
            life, startUP, unitLimit,
            locationList
        };

        questList.push(quest);
    }


    // output file 
    // console.log("output QxZpjdfV.json")
    // fs.writeFileSync("./QxZpjdfV.json", "let QxZpjdfV = " + JSON.stringify(QxZpjdfV, null, 1));

    // console.log("output missionQuestList.js")
    // fs.writeFileSync("./missionQuestList.js", "let missionQuestList = " + JSON.stringify(missionQuestList, null, 1));

    console.log("output missionNameList.js")
    fs.writeFileSync("../html/script/missionNameList.js", "let missionNameList = " + JSON.stringify(missionNameList, null, "\t"));
    // fs.writeFileSync("../html/script/missionNameList.js", "let missionNameList = " + JSON.stringify(missionNameList));


    console.log("output questList.js")
    // sort location
    for (let i in questList) {
        questList[i].locationList.sort((a, b) => {
            if (parseInt(a.ObjectID) != parseInt(b.ObjectID)) return (parseInt(a.ObjectID) > parseInt(b.ObjectID)) ? -1 : 1;
            if (parseInt(a.X) != parseInt(b.X)) return (parseInt(a.X) > parseInt(b.X)) ? -1 : 1;
            if (parseInt(a.Y) != parseInt(b.Y)) return (parseInt(a.Y) > parseInt(b.Y)) ? -1 : 1;
            return 0;
        });
    }
    // sort quest
    questList.sort(function compare(aData, bData) {
        if (aData.missionTitle != bData.missionTitle) return (aData.missionTitle.localeCompare(bData.missionTitle) > 0) ? -1 : 1;
        if (parseInt(aData.questId) != parseInt(bData.questId)) return (parseInt(aData.questId) < parseInt(bData.questId)) ? -1 : 1;
        return 0;
    })
    // output
    let dataList = ["let questList = ["];
    for (let i in questList) {
        dataList.push("\t" + JSON.stringify(questList[i], null, 1).replace(/\s*\n\s*/g, "\t") + ",");
    }; dataList.push("]");
    fs.writeFileSync("../html/script/questList.js", dataList.join("\n"));

};
main()//.catch(console.error);



