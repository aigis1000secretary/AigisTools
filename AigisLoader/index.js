// require
const fs = require("fs");
const path = require("path");
const child_process = require('child_process');
const iconv = require("iconv-lite");
const Jimp = require('jimp');

// switch
const dlRaw = process.env.NODE_DLRAW == "false" ? false : true;
const dlImg = process.env.NODE_DLIMG == "false" ? false : true;;

// vars
const aigisToolPath = `./AigisTools`;
const resourcesPath = `${aigisToolPath}/out/files`;
const rawListPath = `${resourcesPath}/files.txt`;


// method
const urlEncode = function (str_utf8, codePage) {
    let buffer = iconv.encode(str_utf8, codePage);
    let str = "";
    for (let i = 0; i < buffer.length; ++i) { str += "%" + buffer[i].toString(16); }
    return str.toLowerCase();   // .toUpperCase();
}
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }
global.sleep = async function (ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }
console.json = async function (str) { return console.log(JSON.stringify(str, null, 4)); }
String.prototype.in = function (...args) { return args.find((arg) => arg == this); }
String.prototype.inArray = function (args) { return args.find((arg) => arg == this); }
Number.prototype.in = function (...args) { return args.find((arg) => arg == this); }

// get local file list
const getFileList = function (dirPath, filter) {
    if (!filter) { filter = () => true; }

    let result = [];
    let apiResult = fs.readdirSync(dirPath);
    for (let filename of apiResult) {
        let fullpath = dirPath + "/" + filename;
        if (fs.lstatSync(fullpath).isDirectory()) {
            result = result.concat(getFileList(fullpath));
        } else if (filter(fullpath)) {
            result.push(fullpath);
        }
    }
    return result;
};

// aigistool raw to json
const rawDataToJson = function (rawFile) {
    let rawString = fs.readFileSync(rawFile).toString().trim();
    let data = [];
    let raw = rawString.replace(/コストｰ/g, "コスト-").split("\n");
    let keys = raw.shift().match(/[^\s]+/g);

    for (let i in raw) {
        let row = raw[i].replace(/\\"/g, "@");
        let values = row.match(/"[^"]*"|[^\s]+/g);

        let obj = {};
        for (let j in keys) {
            if (!values[j]) { continue; }
            values[j] = values[j].trim().replace(/^nil$/, "null").replace(/@/g, "\\\"");

            obj[keys[j]] = JSON.parse(values[j]);
        }
        data.push(obj);
    }
    return data;
};
// object array to csv file
const arrayDataToCsv = function (array, csvPath) {
    let str = Object.keys(array[0]).join(",");

    for (let obj of array) {
        let values = Object.values(obj);
        values.forEach(val => {
            if (val && val.toString().indexOf(",") != -1) { val = `"${val}"`; }
        });
        str += "\n" + values.join(",");
    }

    fs.writeFileSync(csvPath, str);
    console.log(`fs.writeFileSync( ${csvPath} )`);
}
const getIconMd5 = function (filepath) {
    if (!filepath) { return undefined; }

    // get file md5
    let pngBinary = fs.readFileSync(filepath);
    let md5 = md5f(pngBinary.toString());

    // copy file
    let outputDir = "./html/icons/";
    let outputPath = outputDir + md5;
    if (!fs.existsSync(outputPath))
        fs.createReadStream(filepath).pipe(fs.createWriteStream(outputPath));

    return md5;
}



const downloadRawData = async function () {

    // get_file_list.lua
    console.log("do get_file_list.lua");
    child_process.execSync(`cd ${aigisToolPath} & do get_file_list.lua`).toString().trim();

    // get filelist
    let rawFileReg = /[^,]+$/;
    let rawList = [];
    for (let fullpath of fs.readFileSync(rawListPath).toString().split("\n")) {
        if (rawFileReg.exec(fullpath) != null) {
            rawList.push(rawFileReg.exec(fullpath).toString());
        }
    }
    // filter
    rawList = rawList.filter((filename) => {
        if (/^$/i.test(filename)) { return false; }
        if (/^Emc/i.test(filename)) { return false; }

        // mission data
        if (/MissionConfig\.atb/i.test(filename) ||
            /MissionQuestList\.atb/i.test(filename)) { return dlRaw; }

        // cards data
        if (/PlayerUnitTable\.aar/i.test(filename) ||
            /NameText\.atb/i.test(filename) ||
            /Ability(List|Text)\.atb/i.test(filename) ||
            /Skill(List|Text|TypeList|InfluenceConfig)\.atb/i.test(filename)) { return dlRaw; }

        // map img
        if (/Map\d+/i.test(filename) ||
            /BattleEffect\.aar/i.test(filename)) {
            // skip exist
            if (!fs.existsSync(resourcesPath + "/" + filename)) { return dlImg; }
        }

        // larg size data
        if (/QuestNameText\d*\.atb/i.test(filename) ||
            /ico_\d+/i.test(filename)) { return dlImg; }

        return false;
    });

    // download
    for (let rawFile of rawList) {
        console.log(`get ${rawFile}`);
        child_process.execSync(`cd ${aigisToolPath} & get ${rawFile}`).toString().trim();
    }

    console.log(`do parse_cards.lua`);
    child_process.execSync(`cd ${aigisToolPath} & do parse_cards.lua > out\\files\\cards.txt`).toString().trim();
    console.log(`do get_xmlfile_missions.lua`);
    child_process.execSync(`cd ${aigisToolPath} & do get_xmlfile_missions.lua> out\\files\\missions.txt`).toString().trim();

    console.log("downloadRawData done\n");
}

const aigisChecker = async function () {

    // arrayDataToCsv(cardListData, "./AigisLoader/cards.csv");
    // arrayDataToCsv(classListData, "./AigisLoader/class.csv");

    // result
    let resultArray = [];

    // get png list
    let icons = [].concat(
        getFileList(resourcesPath + "/ico_00.aar"),
        getFileList(resourcesPath + "/ico_01.aar"),
        getFileList(resourcesPath + "/ico_02.aar"),
        getFileList(resourcesPath + "/ico_03.aar"))

    let maxCid = 0;
    for (let card of cardListData) {
        let id = card.CardID;
        maxCid = Math.max(id, maxCid);

        // set json data
        let name = card._name;
        let rare = card.Rare;
        let classID = card.InitClassID;
        let _class = classListData.find(ele => ele.ClassID == classID);
        let sortGroupID = _class ? _class.SortGroupID : 0;
        // 10: 聖霊, 20: 近接, 25: 王子, 30: 遠隔, 40: 兩用
        let placeType = _class ? _class.PlaceAttribute : 0;  // PlaceAttribute
        // 0: 不可放置, 1: 近接, 2: 遠隔, 3: 兩用
        let kind = card.Kind;
        // 0: 男性, 1: 女性, 2: 無性(?), 3: 換金, 2: 經驗
        let isEvent = (card._TradePoint <= 15) ? 1 : 0; // _TradePoint
        let assign = card.Assign;
        // 2: 帝國, 3-4: 遠國, 5: 砂漠, 6-7: 異鄉, 8: 東國
        let genus = card.Genus;
        // 101: 新春, 102: 情人, 103: 學園, 104: 花嫁, 105: 夏季, 106: 萬聖, 107: 聖夜, 108: Q, 109: 溫泉
        // let race = card._TypeRace;
        // // 101: 人類, 201: 獸人, 301: 龍人, 401: 森人, 402: 闇人, 403: 半森人, 501: 礦人, 601: 吸血鬼
        // // 701: 惡魔, 702: 半惡魔, 801: 天使, 901: 妖怪, 1001: 仙人, 1101: 歐克, 1201: 黏土人, 1301: 哥布林, 9901: 聖靈
        // let identity = card.Identity;
        // // 1: アンデッド
        let year = 0;

        // Hero rare data format
        switch (rare) {
            case 11: { rare = 5.1; break; }
            case 10: { rare = 4.1; break; }
            case 7: { rare = 3.5; break; }
        }

        // Collaboration data format
        switch (id) {
            // ランス10-決戦-
            case 581: { assign = -1; break; }

            // 真・恋姫†夢想-革命
            case 648: case 649: case 650:
            case 651: case 652: case 848:
            case 849: case 850: case 851:
            case 852: { assign = -2; break; }

            //  封緘のグラセスタ
            case 719:
            case 720: { assign = -3; break; }

            //  ガールズ・ブック・メイカー（GBM）
            case 815: case 816: case 817:
            case 818: { assign = -4; break; }

            //  流星ワールドアクター
            case 955:
            case 956: { assign = -5; break; }

            case 497: { name += "（遠国の近衛兵）"; break; }
            case 498: { name += "（遠国の前衛戦術家）"; break; }
            case 499: { name += "（遠国の弓兵）"; break; }
            case 501: { name += "（遠国の公子）"; break; }

            case 684: { name += "（異郷の槌使い）"; break; }
            case 685: { name += "（異郷の盗賊）"; break; }
            case 686: { name += "（異郷の回復術士）"; assign = 6; break; }
            case 694: { assign = 7; break; }
            case 689: { name += "（異郷の祝福者）"; assign = 6; break; }
            case 697: { assign = 7; break; }
            case 687: { name += "（異郷の騎士）"; break; }
            case 688: { name += "（異郷の妖精）"; break; }
        }

        // 王子
        if (name.indexOf("王子") != -1 && sortGroupID == 25) {
            rare = 5.2;
        }

        // set year
        if (id <= 85) year = 2013;
        else if (id <= 201) year = 2014;
        else if (id <= 323) year = 2015;
        else if (id <= 437) year = 2016;
        else if (id <= 572) year = 2017;
        else if (id <= 726) year = 2018;
        else if (id <= 942) year = 2019;
        else if (id <= 1500) year = 2020;

        // token flag
        let sellPrice = card.SellPrice;
        if (sellPrice == 0) { sortGroupID = 11; }
        // Non-R18 Collaboration flag
        if (assign == 4 || assign == 7) { sortGroupID = 12; };

        // get image md5&get giles
        let img, imgaw, imgaw2A, imgaw2B;
        let iconName = "/" + id.toString().padStart(3, "0") + "_001.png";
        img = getIconMd5(icons.find(file => (/ico_00\.aar/.test(file) && file.indexOf(iconName) != -1)));
        imgaw = getIconMd5(icons.find(file => (/ico_01\.aar/.test(file) && file.indexOf(iconName) != -1)));
        imgaw2A = getIconMd5(icons.find(file => (/ico_02\.aar/.test(file) && file.indexOf(iconName) != -1)));
        imgaw2B = getIconMd5(icons.find(file => (/ico_03\.aar/.test(file) && file.indexOf(iconName) != -1)));

        // no any img
        if (!img && !imgaw && !imgaw2A && !imgaw2B) { continue; }

        let obj = {
            id,
            name, rare, classID,
            sortGroupID, placeType,
            kind, isEvent, assign, genus, // identity,
            year,
            img, imgaw, imgaw2A, imgaw2B
        };
        // resultJson.push(obj);
        resultArray[id] = obj;
    }
    resultArray = resultArray.filter((r) => (r));

    // ready to write to file
    let cardsJs = [`var maxCid = ${maxCid.toString()};\nvar charaData = [`];
    let cardsDataString = [];
    for (let result of resultArray) {
        cardsDataString.push("\t" + JSON.stringify(result, null, 1).replace(/\s*\n\s*/g, "\t"));
    };
    cardsJs.push(cardsDataString.join(",\n"));
    cardsJs.push("]");

    // write to file
    fs.writeFileSync("./html/script/cardList.js", cardsJs.join("\n"));
    console.log("fs.writeFileSync( ./html/script/cardList.js )");

    console.log("aigisChecker done\n");
}

const aigisTactics = async function () {

    // arrayDataToCsv(missionListData, "./AigisLoader/mission.csv");

    let resourceList = getFileList(resourcesPath);
    let questList = JSON.parse(fs.readFileSync("./html/script/questList.js").toString().replace(/^let questList = /, "").replace(/(,)(\s*)([\]\}])/g, (m, p1, p2, p3) => `${p2}${p3}`));
    // let questList = [];

    // set quest data
    for (let questRaw of missionListData) {
        let id = "mID/qID";
        let questID = questRaw.QuestID;
        let questName = questRaw.QuestTitle;
        let missionID = "mID";
        let missionTitle = "mTitle";
        let map = questRaw.MapNo.toString().padStart(4, "0");;
        let location = questRaw.LocationNo.toString().padStart(2, "0");;
        let life = questRaw.defHP;
        let startUP = questRaw.defAP;
        let unitLimit = questRaw.Capacity;
        let locationList = [];

        // build quest data
        let quest = {
            id,
            missionTitle, questName,
            missionID, questID,
            map, location,
            life, startUP, unitLimit,
            locationList
        };
        let q = questList.find((q) => (q.questID == questID));
        if (q) {
            q = questList.indexOf(q);
            questList[q] = quest;
        } else {
            questList.push(quest);
        }
    }

    // get mission<=>quest raw
    let rawList = resourceList.filter((file) => { return (/MissionQuestList\.atb\S+\.txt$/i.test(file)); });
    // set mission<=>quest 
    for (let raw of rawList) {
        let rawJson = rawDataToJson(raw);

        for (let data of rawJson) {
            let questID = data.QuestID;

            let questName = data.QuestName;
            let missionID = data.MissionID;
            let fullID = missionID + "/" + questID;

            let quest = questList.find((q) => (q.questID == questID));
            if (!!quest) {
                quest.id = fullID;
                quest.missionID = missionID;
                if (!!questName) { quest.questName = questName; }
            }
        }
    }

    // get mission<=>name raw
    rawList = resourceList.filter((file) => /MissionConfig\.atb\S+\.txt$/i.test(file));
    // set mission<=>name 
    for (let raw of rawList) {
        let rawJson = rawDataToJson(raw);

        for (let data of rawJson) {
            let missionID = data.MissionID;

            let missionTitle = data.Name;
            let qIDList = data.QuestID;

            for (let quest of questList.filter((q) => (q.missionID == missionID))) {
                let questID = quest.questID;
                let fullID = missionID + "/" + questID;
                quest.id = fullID;
                quest.missionID = missionID;
                quest.missionTitle = missionTitle;
            }

            if (!!qIDList) {
                for (let questID of qIDList.split(",")) {
                    for (let quest of questList.filter((q) => (q.questID == questID))) {
                        let fullID = missionID + "/" + questID;
                        quest.id = fullID;
                        quest.missionID = missionID;
                        quest.missionTitle = missionTitle;
                    }
                }
            }
        }
    }

    // manual set mission name
    {
        questList.filter((q) => (q.missionID == 100001)).forEach((q) => { q.missionTitle = "第一章　王都脱出"; });
        questList.filter((q) => (q.missionID == 100002)).forEach((q) => { q.missionTitle = "第二章　王城奪還"; });
        questList.filter((q) => (q.missionID == 100003)).forEach((q) => { q.missionTitle = "第三章　熱砂の砂漠"; });
        questList.filter((q) => (q.missionID == 100004)).forEach((q) => { q.missionTitle = "第四章　東の国"; });
        questList.filter((q) => (q.missionID == 100005)).forEach((q) => { q.missionTitle = "第五章　魔法都市"; });
        questList.filter((q) => (q.missionID == 100006)).forEach((q) => { q.missionTitle = "第六章　密林の戦い"; });
        questList.filter((q) => (q.missionID == 100007)).forEach((q) => { q.missionTitle = "第七章　魔の都"; });
        questList.filter((q) => (q.missionID == 100008)).forEach((q) => { q.missionTitle = "第八章　魔神の体内"; });
        questList.filter((q) => (q.missionID == 100009)).forEach((q) => { q.missionTitle = "第九章　鋼の都"; });

        questList.filter((q) => (q.missionID == 200232)).forEach((q) => { q.missionTitle = "ゴールドラッシュ23"; });

        questList.filter((q) => (q.missionID == 310001)).forEach((q) => { q.missionTitle = "魔女を救え！"; });
        questList.filter((q) => (q.missionID == 310002)).forEach((q) => { q.missionTitle = "魔女の娘"; });
        questList.filter((q) => (q.missionID == 310003)).forEach((q) => { q.missionTitle = "聖戦士の挑戦"; });
        questList.filter((q) => (q.missionID == 310004)).forEach((q) => { q.missionTitle = "魔術の秘法"; });
        questList.filter((q) => (q.missionID == 310005)).forEach((q) => { q.missionTitle = "鬼招きの巫女"; });
        questList.filter((q) => (q.missionID == 310006)).forEach((q) => { q.missionTitle = "暗黒騎士団の脅威"; });
        questList.filter((q) => (q.missionID == 310007)).forEach((q) => { q.missionTitle = "モンクの修行場"; });
        questList.filter((q) => (q.missionID == 310008)).forEach((q) => { q.missionTitle = "囚われの魔法剣士"; });
        questList.filter((q) => (q.missionID == 310009)).forEach((q) => { q.missionTitle = "獣人の誇り"; });
        questList.filter((q) => (q.missionID == 310010)).forEach((q) => { q.missionTitle = "堕天使の封印"; });
        questList.filter((q) => (q.missionID == 310011)).forEach((q) => { q.missionTitle = "古代の機甲兵"; });
        questList.filter((q) => (q.missionID == 310012)).forEach((q) => { q.missionTitle = "闇の忍者軍団"; });
        questList.filter((q) => (q.missionID == 310013)).forEach((q) => { q.missionTitle = "鬼を宿す剣士"; });
        questList.filter((q) => (q.missionID == 310014)).forEach((q) => { q.missionTitle = "影の狙撃手"; });
        questList.filter((q) => (q.missionID == 310015)).forEach((q) => { q.missionTitle = "魔人の宿命"; });
        questList.filter((q) => (q.missionID == 310016)).forEach((q) => { q.missionTitle = "暗黒舞踏会"; });
        questList.filter((q) => (q.missionID == 310017)).forEach((q) => { q.missionTitle = "アンナと雪の美女"; });
        questList.filter((q) => (q.missionID == 310018)).forEach((q) => { q.missionTitle = "戦乙女の契約"; });
        questList.filter((q) => (q.missionID == 310019)).forEach((q) => { q.missionTitle = "山賊王への道"; });
        questList.filter((q) => (q.missionID == 310020)).forEach((q) => { q.missionTitle = "竜騎士の誓い"; });
        questList.filter((q) => (q.missionID == 310021)).forEach((q) => { q.missionTitle = "錬金術士と賢者の石"; });
        questList.filter((q) => (q.missionID == 310022)).forEach((q) => { q.missionTitle = "聖鎚闘士の挑戦"; });
        questList.filter((q) => (q.missionID == 310023)).forEach((q) => { q.missionTitle = "砲科学校の訓練生"; });
        questList.filter((q) => (q.missionID == 310024)).forEach((q) => { q.missionTitle = "死霊の船と提督の決意"; });
        questList.filter((q) => (q.missionID == 310025)).forEach((q) => { q.missionTitle = "帝国の天馬騎士"; });
        questList.filter((q) => (q.missionID == 310026)).forEach((q) => { q.missionTitle = "暗黒騎士団と狙われた癒し手"; });
        questList.filter((q) => (q.missionID == 310027)).forEach((q) => { q.missionTitle = "白の帝国と偽りの都市"; });
        questList.filter((q) => (q.missionID == 310028)).forEach((q) => { q.missionTitle = "暗黒騎士団と聖夜の贈り物"; });
        questList.filter((q) => (q.missionID == 310029)).forEach((q) => { q.missionTitle = "呪術師と妖魔の女王"; });
        questList.filter((q) => (q.missionID == 310030)).forEach((q) => { q.missionTitle = "私掠船長と魔の海域"; });
        questList.filter((q) => (q.missionID == 310031)).forEach((q) => { q.missionTitle = "ヴァンパイアと聖なる復讐者"; });
        questList.filter((q) => (q.missionID == 310032)).forEach((q) => { q.missionTitle = "妖魔の女王と戦術の天才"; });
        questList.filter((q) => (q.missionID == 310033)).forEach((q) => { q.missionTitle = "魔界蟻と囚われた男達"; });
        questList.filter((q) => (q.missionID == 310034)).forEach((q) => { q.missionTitle = "天使たちの陰謀"; });
        questList.filter((q) => (q.missionID == 310035)).forEach((q) => { q.missionTitle = "魔蝿の森と呪われた番人"; });
        questList.filter((q) => (q.missionID == 310036)).forEach((q) => { q.missionTitle = "失われた竜の島"; });
        questList.filter((q) => (q.missionID == 310037)).forEach((q) => { q.missionTitle = "帝国神官の帰還"; });
        questList.filter((q) => (q.missionID == 310038)).forEach((q) => { q.missionTitle = "闇の組織と狙われた王子"; });
        questList.filter((q) => (q.missionID == 310039)).forEach((q) => { q.missionTitle = "オーク格闘家の王子軍入門"; });
        questList.filter((q) => (q.missionID == 310040)).forEach((q) => { q.missionTitle = "王子軍の夏祭り"; });
        questList.filter((q) => (q.missionID == 310041)).forEach((q) => { q.missionTitle = "カリオペと恐怖の夜"; });
        questList.filter((q) => (q.missionID == 310042)).forEach((q) => { q.missionTitle = "夢現のダークプリースト"; });
        questList.filter((q) => (q.missionID == 310043)).forEach((q) => { q.missionTitle = "魔王軍の胎動"; });
        questList.filter((q) => (q.missionID == 310044)).forEach((q) => { q.missionTitle = "彷徨える守護の盾"; });
        questList.filter((q) => (q.missionID == 310045)).forEach((q) => { q.missionTitle = "渚に咲きし水着騎兵"; });
        questList.filter((q) => (q.missionID == 310046)).forEach((q) => { q.missionTitle = "カボチャの国の魔法使い"; });
        questList.filter((q) => (q.missionID == 310047)).forEach((q) => { q.missionTitle = "星に祈りし聖夜の癒し手"; });
        questList.filter((q) => (q.missionID == 310048)).forEach((q) => { q.missionTitle = "学園騎兵科の新入生"; });
        questList.filter((q) => (q.missionID == 310049)).forEach((q) => { q.missionTitle = "白き獣人と闇の組織"; });
        questList.filter((q) => (q.missionID == 310050)).forEach((q) => { q.missionTitle = "砂浜を駆ける魔術師"; });
        questList.filter((q) => (q.missionID == 310051)).forEach((q) => { q.missionTitle = "密林のハロウィンパーティー"; });
        questList.filter((q) => (q.missionID == 310052)).forEach((q) => { q.missionTitle = "デーモンサンタのおもちゃ工場"; });
    }

    // QuestNameText000000.atb/ALTB_gdtx.txt
    rawList = resourceList.filter((file) => /QuestNameText\d+\S+\.txt$/i.test(file));
    // set quest<=>name
    for (let raw of rawList) {
        let rawJson = rawDataToJson(raw);
        let missionID = parseInt(raw.replace(/^(.+QuestNameText)(\d+)(\.atb.+)$/, (m, p1, p2, p3) => (p2)))

        for (let i in rawJson) {
            let data = rawJson[i];
            let questName = data.Message;

            let quest = questList.find((q) => (q.missionID == missionID && q.questName == i));
            if (!!quest) {
                quest.questName = questName;
            }
        }
    }

    // pad tower mapname
    questList.filter((q) => (q.missionID == 110001)).forEach((q) => { q.map = "110001_" + q.map; });
    // copy map loacltion data
    rawList = resourceList.filter((file) => /Map\d\S+\.aar\S+Location\d+\S+\.txt$/i.test(file));
    for (let raw of rawList) {
        let rawJson = rawDataToJson(raw);

        let map = raw.replace(/^(.+Map)(\d\S+)(\.aar.+)$/, (m, p1, p2, p3) => (p2));
        let location = raw.replace(/^(.+Location)(\d+)(\.atb.+)$/, (m, p1, p2, p3) => (p2));

        for (let quest of questList.filter((q) => (q.map == map && q.location == location))) {
            for (let data of rawJson) {
                quest.locationList.push({
                    ObjectID: data.ObjectID,
                    X: data.X,
                    Y: data.Y,
                    _Command: data._Command
                });
            }
        }
    }

    // sort location
    for (let quest of questList) {
        quest.locationList.sort((a, b) => {
            if (parseInt(a.ObjectID) != parseInt(b.ObjectID)) return (parseInt(a.ObjectID) > parseInt(b.ObjectID)) ? -1 : 1;
            if (parseInt(a.X) != parseInt(b.X)) return (parseInt(a.X) > parseInt(b.X)) ? -1 : 1;
            if (parseInt(a.Y) != parseInt(b.Y)) return (parseInt(a.Y) > parseInt(b.Y)) ? -1 : 1;
            return 0;
        });
        quest.locationList = quest.locationList.filter((item) => item === quest.locationList.find(((pos) =>
            pos.ObjectID == item.ObjectID &&
            pos.X == item.X &&
            pos.Y == item.Y
        )));
    }

    // sort quest
    questList.sort(function compare(aData, bData) {
        if (aData.missionTitle != bData.missionTitle) return (aData.missionTitle.localeCompare(bData.missionTitle) > 0) ? -1 : 1;
        if (parseInt(aData.questID) != parseInt(bData.questID)) return (parseInt(aData.questID) < parseInt(bData.questID)) ? -1 : 1;
        return 0;
    })

    // ready to write to file
    let questJs = ["let questList = ["];
    let questDataString = [];
    for (let quest of questList) { questDataString.push("\t" + JSON.stringify(quest, null, 1).replace(/\s*\n\s*/g, "\t")); };
    questJs.push(questDataString.join(",\n"));
    questJs.push("]");

    // write to file
    fs.writeFileSync("./html/script/questList.js", questJs.join("\n"));
    console.log("fs.writeFileSync( ./html/script/questList.js )");

    // ready to write to file
    let missionJS = ["let missionTitleList = {"];
    let missionDataString = [];
    for (let quest of questList) {
        let str = `\t"${quest.missionID}": "${quest.missionTitle}"`;
        if (missionDataString.indexOf(str) == -1) { missionDataString.push(str); }
    };
    // missionDataString.sort();
    missionJS.push(missionDataString.join(",\n"));
    missionJS.push("}");

    // write to file
    fs.writeFileSync("./html/script/missionTitleList.js", missionJS.join("\n"));
    console.log("fs.writeFileSync( ./html/script/missionTitleList.js )");

    console.log("aigisChecker done\n");
}

const aigisMapHash = async function () {

    let resourceList = fs.readdirSync(resourcesPath).filter((file) => (/^Map[\d_]+\.png$/i.test(file)));
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/768_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/769_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/782_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/783_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/777_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/777_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/780_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/787_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/785_001.png");
    resourceList.push("BattleEffect.aar/228_tex_weather.atx/frames/793_001.png");

    // map png
    let mapHashList = {};
    for (let resource of resourceList) {

        let sourcePath = resourcesPath + "/" + resource;
        let fileName = path.win32.basename(sourcePath);
        let pngBinary = fs.readFileSync(sourcePath);
        let md5 = md5f(pngBinary.toString());
        mapHashList[fileName] = md5;

        let outputDir = /^map/i.test(resource) ? "./html/maps/" : "./html/weather/";
        let outputPath = outputDir + md5;

        if (!fs.existsSync(outputPath)) {
            if (/^map/i.test(resource)) {
                await new Promise(function (resolve, reject) {
                    Jimp.read(sourcePath)
                        .then(img => {
                            console.log(` getting ${resource} md5...`);
                            return img.quality(70) // set JPEG quality
                                .write(outputPath + ".jpg"); // save
                        }).then(async () => {
                            console.log("Jimp.quality(70).write()");
                            await sleep(100);
                            let log = child_process.execSync(`cd ${outputDir}&ren ${md5}.jpg ${md5}`).toString().trim();
                            if (log != "") console.log(log);
                        }).then(() => {
                            console.log("");
                            resolve();
                        }).catch(err => {
                            console.error(sourcePath);
                            console.error(err);
                            reject();
                        });
                });
            } else {
                console.log(` getting ${resource} md5...`);
                fs.createReadStream(sourcePath).pipe(fs.createWriteStream(outputPath));
            }
        }
    }

    fs.writeFileSync("./html/script/mapHashList.js", "let mapHashList = " + JSON.stringify(mapHashList, null, "\t"));
    console.log("fs.writeFileSync( ./html/script/mapHashList.js )");

    console.log("aigisMapHash done\n");
}

const aigisCharacter = async function () {

    // arrayDataToCsv(skillListData, "./AigisLoader/skillList.csv");
    // arrayDataToCsv(skillTextData, "./AigisLoader/skillText.csv");
    // arrayDataToCsv(skillTypeData, "./AigisLoader/skillType.csv");
    // arrayDataToCsv(skillInflData, "./AigisLoader/skillInfl.csv");

    let textFormat = function (str) {

        let enterRegA1 = new RegExp(`(${[
            "\\)", "】", "」", "〉",
            "を", "は", "の", "に", "と", "な", "た", "む", "め", "へ",
            "しか", "から",
            "スキル", "クラス",
            "ランダム", "ミッション",

            "後", "無", "体", "発", "秒", "倒", "防", "再", "属", "攻", "耐", "可", "終", "内",
            "騎士", "最大", "時間", "対象", "魔法", "物理", "射程", "距離", "鈍足", "配置", "味方",
            "引き", "必ず", "だけ", "待ち", "短い",
            "与える", "受ける", "対する", "対して",
            "発射する",

            "ユニッ?ト?", "トーク?ン?", "アビリ?テ?ィ?", "ブロッ?ク?数?", "出撃?",
            "[^る]が", "[い劣]る", "[同破]時", "一[度定]", "[連継]続", "[範周]囲", "以[上下]", "[初次]回",
            "[およ再及]+び", "[連続確率可能間撃力連射自動倍以下]+で", "[使用体]+まで",
            "[\\d\\.]+で",
            "[\\n]効果"
        ].join("|")})(\\n)`, 'g');
        let enterRegA2 = new RegExp(`(\\n)(${[
            "\\(", "【", "「", "〈", "\\+",
            "を", "は", "の", "が", "に", "て", "で", "と", "し", "ず", "げ", "へ", "な", "き", "る",
            "した", "まで", "から", "され", "させ", "する", "キル",
            "アップ",
            "アイテム", "ユニット",
            "トークンを",

            "倍", "毎", "力", "分", "用", "体", "系", "後", "率",
            "短縮", "距離", "以外", "以下", "剣に", "中は", "受け", "低下", "可能", "能力", "入手", "確率", "発生", "速度", "属性", "無視",
            "範囲が",
            "発射して",

            "時間?",
            "た[時場]", "出[来身]",
            "回復[量\\+]", "[所持味方の]*数",
            "[\\d\\.]+倍", "[\\d\\.]+％上昇", "[\\d\\.]+％減少",
            "減少", "上昇[\\n]", "軽減[\\n]"

        ].join("|")})`, 'g');

        let enterRegB1 = new RegExp(`(${[
            "が", "き", "け", "げ", "し", "じ", "ず", "す", "せ", "び", "り", "る",
            "ない", "され",
            "だけで", "アップ",

            "中", "倍", "分", "加", "化", "射", "後", "撃", "時", "減", "系",    // "力",
            "付与", "発動", "場合", "召喚", "減少", "使役", "回復", "入手", "上昇", "麻痺", "無視", "短縮", "可能", "回避", "無限", "停止", "行う", "替え", "持ち",
            "応じて", "人まで",

            "配置中の?み?",
            "扱[いう]",
            "[\\d\\.]+％?"

        ].join("|")})(\\n|、)`, 'g');
        let enterRegB2 = new RegExp(`(\\n|、)(${[
            "ＨＰ", "防御", "魔", // "攻撃",
            "および", "さらに", "クラス",
            "アビリティ",

            "次", "全",
            "付属", "効果", "終了", "味方", "自動", "撤退", "出撃", "優先",

            "ご?く?まれに", "ス?キ?ル?発動時",
            "[低中高]確率", "トークン[所持]*数",
            "攻撃[^\\n]",
            "[\\d\\.]+"

        ].join("|")})`, 'g');

        let regSort = ["最大ＨＰ", "ＨＰ", "攻撃力", "攻撃", "防御力", "防御", "魔法耐性", "射程"];
        let regSortf = ((a, b) => regSort.indexOf(a) == regSort.indexOf(b) ? 0 : regSort.indexOf(a) > regSort.indexOf(b) ? 1 : -1);
        let r1 = "([^視][秒のがでに、]|^)";
        let r2 = `(${regSort.join("|")})`;
        let r3 = "([と\/\n(及び)、]*)";
        let r4 = "([\\+がの\\dを無])";
        let reg3 = new RegExp(`${r1}${r2}${r3}${r2}${r3}${r2}${r4}`, 'g');
        let reg2 = new RegExp(`${r1}${r2}${r3}${r2}${r4}`, 'g');

        return str
            .replace(/０/g, "0").replace(/１/g, "1").replace(/２/g, "2").replace(/３/g, "3").replace(/４/g, "4")
            .replace(/５/g, "5").replace(/６/g, "6").replace(/７/g, "7").replace(/８/g, "8").replace(/９/g, "9")
            .replace(/HP/g, "ＨＰ")
            .replace(/（/g, "(").replace(/）/g, ")").replace(/＋/g, "+").replace(/－/g, "-").replace(/\:/g, "：")
            .replace(/%c\[[\S]{6}\]/g, "")  // %c[ff0000]
            .replace(/%/g, "％")
            .replace(/。/g, "、")

            .replace(/[\s・]*、[\s・]*/g, "、") // .replace(/\s*(・|。|、)\s*/g, "、")  
            .replace(/[\s・]*\n[\s・]*/g, "\n")
            .replace(/[\s]*\/[\s]*/g, "\/")
            .replace(/倍　/g, "倍\n")
            .replace(/　/g, "@")
            .replace(/[\n ]+/g, "\n")

            .replace(enterRegA1, (m, p1, p2) => `${p1}`)
            .replace(enterRegA2, (m, p1, p2) => `${p2}`)
            .replace("無視\n攻撃", "無視攻撃")
            .replace("(と|の)(攻撃)(\n)(対象)", (m, p1, p2, p3, p4) => `${p1}${p2}${p4}`)

            .replace(enterRegB1, (match, p1, p2) => `${p1}＃`)
            .replace(enterRegB2, (match, p1, p2) => `＃${p2}`)

            .replace(/＃/g, "、")
            .replace(/、$/g, "")
            .replace(/\n/g, "")
            .replace(/(、?)(以下[^、]*発動)(、)/g, (match, p1, p2, p3) => `、${p2}：`)

            .replace(/魔耐/g, "魔法耐性")    //
            .replace(reg3, (match, ps, p2, p3, p4, p5, p6, pe) =>
                `${ps}${[p2, p4, p6].filter((p) => p.inArray(regSort)).sort(regSortf).join("と").replace(/力/g, "")}${pe}`
            )
            .replace(reg2, (match, ps, p2, p3, p4, pe) =>
                `${ps}${[p2, p4].filter((p) => p.inArray(regSort)).sort(regSortf).join("と").replace(/力/g, "")}${pe}`
            )

            .replace(/神魔法[\s]回復の雨/g, "神魔法・回復の雨")
            .replace(/(「.*)(\s)(.*」)/g, (match, p1, p2, p3) => `${p1}${p3}`)
            .replace(/@/g, "　");
    }

    let getSkillData = function (card, skillID) {
        let skillData = { name: [], text: [], nextSkill: 0 };
        if (skillID == 0) { return skillData; }

        let skillIDList = [];

        while (true) {
            // get skill obj
            let skill = skillListData[skillID];
            // get skill base data
            let name = skill.SkillName;
            let text = skillTextData[skill.ID_Text].Data_Text.replace(/[\s]+\n[\s]+/g, "\n");
            text = text.replace("(現在[NUM_TARGET]体)", "");
            text = text.replace("[NUM_TARGET]", "X");
            text = text.replace(/\[/g, "<").replace(/\]/g, ">");
            text = text.replace("<TIME>", skill.ContTimeMax);
            let nextSkill = 0;
            let POW = skill.PowerMax;

            // get skill influence
            let type = skillTypeData.find(ele => ele.SkillTypeID == skill.SkillType);
            let infl = [];
            for (let i = skillInflData.findIndex(ele => ele.Data_ID == type.ID_Influence); i < skillInflData.length; ++i) {
                let infl0 = skillInflData[i];
                if (infl0.Data_ID != 0 && infl0.Data_ID != type.ID_Influence) { break; }
                infl.push(infl0);
            }

            infl = infl.filter(ele => {
                let iExpression = ele._ExpressionActivate;
                if (skillID == 1346 && ele.Data_InfluenceType == 83) { return false; }
                if (skillID == 663 && !ele.Data_InfluenceType.in(2, 89)) { return false; }
                if (ele.Data_InfluenceType == 6 && skillID.in(326, 673, 1307, 1456, 1457)) { return false; }
                if (skillID.in(1027, 1028, 1029) && ele.Data_InfluenceType == 2) { return false; }
                if (iExpression == "") { return true; }

                iExpression = iExpression
                    .replace(/IsCardID/g, `${card.CardID} == `)
                    .replace(/IsSkillID/g, `${skillID} == `)
                    .replace(/IsClassID/g, `${card.InitClassID} == `)
                    .replace(/GetClassID\(\)/g, card.InitClassID)

                    .replace(/GetClassChange\(\)/g, 2)          // 覺醒值 0~4
                    .replace(/IsMoreClassChange\(2\)/g, true)   // 覺醒 Y/N?

                    .replace(/IsClassType\([^\)]+\)/g, false)  // 特定職業條件
                    .replace(/GetUnitInBattleMatchCount\([\S\s]+\) [>=]{2} \d{1}/g, true)  // 滿足特定條件的人數
                    .replace(/GetEntryUnitCount\(\)/g, 6)  // 下場人數
                    .replace(/GetSysVer\(\) [<=>]+ \d+/g, false);
                return eval(iExpression);
            });

            for (let influence of infl) {
                let iType = influence.Data_InfluenceType;

                let m1 = influence.Data_MulValue;
                let m2 = influence.Data_MulValue2;
                let m3 = influence.Data_MulValue3;
                let a1 = influence.Data_AddValue;
                let m4 = influence._HoldRatioUpperLimit;

                let desc = "";
                if (m1 == 0 && m2 == 0 && m3 == 0) {
                    desc = a1;
                } else {
                    let pow_string = "";
                    if (m2 == 100) {
                        pow_string = `POW / 100`;
                    } else if (m2 == 0) {
                        pow_string = null;
                    } else {
                        pow_string = `((${m2} / 100) * (POW - 100) + 100) / 100`;
                    }
                    if (!!pow_string && m3 != 0) {
                        // pow_string = pow_string.replace("POW", m3);
                        pow_string = pow_string.replace("POW", Math.max(m3, m4));
                        if (iType.in(3, 5)) {
                            pow_string = `(${pow_string}) - 1`;
                        }
                    }
                    if (!pow_string && iType.in(12, 13)) {
                        pow_string = a1 + 1;
                    }
                    desc = eval(pow_string);    // POW
                    if (desc == 1.0 && a1 != 0) { desc = a1; }
                }

                if (iType == 6 && card.InitClassID == 12500) { desc = Math.round(desc / 0.115) / 10; }

                // iType == 187 即死
                let desc100 = Math.round(desc * 100);
                if (iType == 2) { text = text.replace(/<ATK>|<POW_R>|<PATK>/, desc); }         // ATK
                if (iType == 3) { text = text.replace(/<ATK>|<POW_I>/, desc100); }   // ALL ATK
                if (iType == 4) { text = text.replace(/<DEF>|<POW_R>/, desc); }         // DEF
                if (iType == 5) { text = text.replace(/<DEF>|<POW_I>/, desc100); }   // ALL DEF
                if (iType == 6) { text = text.replace(/<RNG>|<POW_R>/, desc); }
                if (iType == 7) { text = text.replace(/<NUM_SHOT>/, desc); }
                if (iType == 8) { text = text.replace(/<AREA>|<POW_R>/, desc); }
                if (iType == 9) { text = text.replace(/<AVOID>/, desc100); }
                if (iType == 10) { text = text.replace(/<AVOID>/, desc100); }
                if (iType == 11) { text = text.replace(/<POW_R>/, desc); }              // HP
                if (iType == 12) { text = text.replace(/<NUM_BLOCK>/, desc); }
                if (iType == 13) { text = text.replace(/<NUM_ATK>/, desc); }
                if (iType == 19) { text = text.replace(/<MDEF>|<POW_R>/, desc); }
                if (iType == 22) { text = text.replace(/<NUM_TRG>/, desc); }
                if (iType == 31) { text = text.replace(/<POW_I>/, desc100); }        // HEAL
                if (iType == 32) { text = text.replace(/<POW_I>/, desc100); }        // ADD COST
                if (iType == 33) { text = text.replace(/<POW_I>/, desc100); }        // PH DEF%
                if (iType == 34) { text = text.replace(/<MDEF>/, desc100); }         // MDEF
                if (iType == 35) { text = text.replace(/<POW_I>/, desc100); }        // ATK+HP
                if (iType == 37) { text = text.replace(/<POW_I>/, desc100); }        // ATK DEBUFF
                if (iType == 54) { text = text.replace(/<POW_I>/, desc100); }        // LUK DEF
                if (iType == 83) { text = text.replace(/<POW_R>/, desc); }
                if (iType == 83) { text = text.replace(/<POW_I>/, desc100); }        // MAX HP
                if (iType == 85) { text = text.replace(/<POW_R>/, desc); }
                if (iType == 89) { text = text.replace(/<ATK>|<POW_R>/, desc); }
                if (iType == 90) { text = text.replace(/<DEF>|<POW_R>/, desc); }
                if (iType == 103) { text = text.replace(/<POW_I>/, desc100); }   // ATK DEBUFF
                if (iType == 105) { text = text.replace(/<POW_I>/, desc100); }   // UNKNOWN
                if (iType == 108) { text = text.replace(/<POW_I>/, desc100); }   // HP CUT
                if (iType == 137) { text = text.replace(/<POW_R>/, desc); }         // AB BUFF
                if (iType == 141) { text = text.replace(/<ATK>|<POW_R>/, desc); }
                if (iType == 142) { text = text.replace(/<DEF>|<POW_R>/, desc); }
                if (iType == 178) { text = text.replace(/<POW_I>/, desc100); }

                // if (iType == 121) { change skill text }

                if (iType == 49) { nextSkill = a1; }

                text = text.replace("<HERO_POW>", 12);

                // debug log
                // influence.iType = iType;
                // influence.desc = desc;
            }
            // debug log
            // skillData.infl = infl;

            text = textFormat(text);
            if (skillIDList.indexOf(skillID) == -1) {
                if (skillData.text.indexOf(text) == -1) {
                    skillIDList.push(skillID)
                    skillData.name.push(name);
                    skillData.text.push(text);
                }
            } else { break; }

            if (nextSkill == 0) { break; }
            if (nextSkill == card.ClassLV1SkillID) { break; }
            // if (skillListData[nextSkill].SkillName == skillListData[card.ClassLV1SkillID].SkillName) { break; }
            skillID = nextSkill;
        }

        return skillData;
    };

    let getAbilityData = function (abilityID) {
        let abilityData = { name: "", text: "" };
        if (abilityID == 0) { return abilityData; }

        let ability = abilityListData[abilityID];
        abilityData.name = ability.AbilityName;
        abilityData.text = textFormat(abilityTextData[ability.AbilityTextID].AbilityText.replace("%d", ability.AbilityPower));

        return abilityData;
    };

    // result
    let resultArray = [];

    for (let card of cardListData) {

        // skip npc
        if (!card.SellPrice ||
            /ダミー/.test(card._name)
        ) { continue; }
        // if (/ダミー|^魔物$/.test(card._name) ||
        //     /NPC/.test(card.ClassName)
        // ) { continue; }


        // _name
        let _name = card._name;
        if (card.Rare == 10 && ! /聖霊/.test(card._name)) { _name = card._name + "【白金英傑】"; }
        if (card.Rare == 11 && ! /聖霊/.test(card._name)) { _name = card._name + "【黒英傑】"; }
        let _subName = nameTextData.find((e) => e.Message == card._name); _subName = _subName ? _subName.RealName : "";


        // skill/AB
        let ability, ability_aw;
        let skill = "", skill_aw = "";
        let _ability, _ability_aw;
        let _skill, _skill_aw;
        let className = classListData.find(ele => ele.ClassID == card.InitClassID).Name.trim().replace(/^(ちび|下級)?(中級)?/, "");
        if (/聖霊|技強化ユニット/.test(className) && !/戦の聖霊/.test(className)) { className = "聖霊"; }
        if (/大邪仙/.test(className)) { className = "邪仙"; }
        if (/屍道士/.test(className)) { className = "キョンシー"; }
        if (/デモンマスター/.test(className)) { className = "デモンサモナー"; }

        if (card.CardID.in(1, 309, 552, 554, 563, 604, 644, 690, 741, 771, 775, 782, 929, 950)) {
            if (card.CardID == 1) { _name = "王子【通常】"; }
            className = "王子";

            let data = getAbilityData(0);
            // if (card.CardID == 1) { data = { name: "戦意高揚【通常】", text: "出撃している全員の攻撃と防御が12％上昇、出撃中は常に発動" } }
            if (card.CardID == 309) { data = { name: "戦意高揚", text: "配置中味方全体のユニットの攻撃と防御が20％上昇" } }
            if (card.CardID == 552) { data = { name: "戦意高揚", text: "配置中味方全体のユニットの攻撃と防御が20％上昇" } }
            if (card.CardID == 554) { data = { name: "戦意高揚【小】", text: "配置中味方全体のユニットの攻撃と防御が10％上昇" } }
            if (card.CardID == 563) { data = { name: "戦意高揚【砂漠】", text: "配置中味方全体のユニットの攻撃と防御が20％上昇、出撃メンバーにいるだけで、砂漠の国出身の味方ユニットの攻撃力+10％" } }
            if (card.CardID == 604) { data = { name: "戦意高揚【獣】", text: "配置中味方全体のユニットの攻撃と防御+20％、出撃メンバーにいるだけで、獣人属性ユニットの味方ユニットの攻撃力+10％" } }
            if (card.CardID == 644) { data = { name: "戦意高揚【巨像】", text: "配置中味方全体のユニットの攻撃と防御+20％、スキル発動時に天使系、人間系の敵の動きを止める" } }
            if (card.CardID == 690) { data = { name: "戦意高揚【風護】", text: "配置中味方全体のユニットの攻撃と防御+18％、5％の確率で味方へのダメージを無効化する" } }
            if (card.CardID == 741) { data = { name: "戦意高揚【ちび】", text: "配置中味方全体のユニットの攻撃と防御が10％上昇、出撃メンバーにいるだけで、ちび属性ユニットの攻撃力+15％" } }
            if (card.CardID == 771) { data = { name: "戦意高揚【英魂】", text: "配置中味方全体の攻撃防御+20％、ソルジャー系、ヘビーアーマー系、ワルキューレ系、アーチャー系、ヒーラー系クラスは更に+5％" } }
            // if (card.CardID == 775) { data = { name: "", text: "" } }
            if (card.CardID == 782) { data = { name: "戦意高揚【ダーク】", text: "配置中味方全体の攻撃防御+20％、出撃メンバーにいるだけで、デーモン、アンデッド、ゴブリン、オーク属性ユニットのＨＰ+10％" } }
            if (card.CardID == 929) { data = { name: "英雄の鼓舞", text: "配置中全味方の攻撃防御+20％、出撃メンバーにいるだけで、全味方ユニットのＨＰ+20％、非スキル中はブロック数0で攻撃しない" } }
            if (card.CardID == 950) { data = { name: "戦意高揚【四神】", text: "配置中味方全体の攻撃防御+20％ＨＰを徐々に回復(0.5秒毎に15回復)" } }
            data.text = textFormat(data.text);

            _ability = getAbilityData(0);
            _ability_aw = data;

            _skill = getSkillData(card, 0);
            _skill_aw = getSkillData(card, card.EvoSkillID);

        } else {

            _ability = getAbilityData(card.Ability_Default);
            _ability_aw = getAbilityData(card.Ability);

            _skill = getSkillData(card, card.ClassLV1SkillID || card.ClassLV0SkillID);
            _skill_aw = getSkillData(card, card.EvoSkillID);

            // if (/^ちび|^ねんどろいど/.test(card._name)) {
            //     _ability_aw = getAbilityData(0);
            //     _skill_aw = getSkillData(card, 0);
            // }

            // if (/刻聖霊/.test(card._name)) {
            //     // _ability = getAbilityData(card.Ability_Default || card.Ability);
            //     _ability_aw = getAbilityData(0);

            //     // _skill = getSkillData(card, card.ClassLV1SkillID || card.EvoSkillID);
            //     _skill_aw = getSkillData(card, 0);
            // }
            if (/刻聖霊/.test(card._name)) {
                _ability = getAbilityData(0);
                _skill = getSkillData(card, 0);
            }
            if (classListData.find(ele => ele.ClassID == card.InitClassID).JobChange == 0) {
                _ability_aw = getAbilityData(0);
                _skill_aw = getSkillData(card, 0);
            }
            if (card._AppearAbilityLevel == 55 || card.CardID == 80) {
                _skill_aw = getSkillData(card, 0);
            }
            if (card.Rare > 9) {
                _ability = getAbilityData(0);
            }
        }
        // for (let data of _skill) { skill += `▹${data.name}\n${data.text}\n`; };
        // for (let data of _skill_aw) { skill_aw += `▸${data.name}\n${data.text}\n`; };
        if (_skill.name) for (let i in _skill.name) { skill += `▹${_skill.name[i]}\n${_skill.text[i]}\n`; };
        if (_skill_aw.name) for (let i in _skill_aw.name) { skill_aw += `▸${_skill_aw.name[i]}\n${_skill_aw.text[i]}\n`; };
        skill = skill.trim();
        skill_aw = skill_aw.trim();
        ability = !!_ability.name ? `▹${_ability.name}\n${_ability.text}` : "";
        ability_aw = !!_ability_aw.name ? `▸${_ability_aw.name}\n${_ability_aw.text}` : "";


        let rarity = {
            0: "アイアン", 1: "ブロンズ", 2: "シルバー",
            3: "ゴールド", 4: "プラチナ", 5: "ブラック", 7: "サファイア",
            10: "プラチナ", 11: "ブラック"  // 英傑
        }[card.Rare];


        let urlName;
        {
            let url = _name;
            // if (card.CardID == 660)) { url = url.replace(/\s/g, ""); }
            if (/聖霊/.test(url) && card.InitClassID < 50) { url = "特殊型"; }
            if (card.CardID.in(1, 309, 552, 554, 563, 604, 644, 690, 741, 771, 775, 782, 929, 950)) { urlName = "%b2%a6%bb%d2"; }
            else if (card.CardID == 4) { urlName = "%bb%b3%c2%b1%20%bc%ea%b2%bcA"; }
            else if (card.CardID == 67) { urlName = "%bb%b3%c2%b1%20%bc%ea%b2%bcB"; }
            else if (card.CardID == 435) { urlName = "%bc%f2%c6%dd%c6%b8%bb%d2%a4%ce%cc%bc%b5%b4%bf%cf%c9%b1"; }
            else if (card.CardID == 547) { urlName = "%cd%c5%b8%d1%c2%c4%c9%b1"; }
            else if (card.CardID == 661) { urlName = "%c0%e9%ce%be%a4%ab%a4%d6%a4%ad%c9%b1%b9%c8%b2%b4%c3%b0"; }
            else if (card.CardID == 730) { urlName = "%c7%af%b2%ec%a4%ce%c3%e5%b0%e1%bb%cf%20%b5%b4%bf%cf%c9%b1"; }
            else { urlName = urlEncode(url, "EUC-JP"); }
        }


        let obj = {
            name: _name,
            subName: _subName,
            ability, ability_aw,
            skill, skill_aw,
            urlName,
            rarity,
            class: className
        }


        if (!resultArray.find(ele => ele.name == obj.name)) {
            resultArray.push(obj);
        }
    }


    // sort
    resultArray.sort((A, B) => {
        // return (A.rarity == B.rarity) ? A.name.localeCompare(B.name) : A.rarity.localeCompare(B.rarity);
        return (A.rarity == B.rarity) ? A.name.localeCompare(B.name) : A.rarity.toString().localeCompare(B.rarity.toString());
    });


    // object to json
    fs.writeFileSync("./AigisLoader/CharaDatabase.json", JSON.stringify(resultArray, null, "\t").replace(/\": /g, "\":\t"));
    console.log("fs.writeFileSync( ./AigisLoader/CharaDatabase.json )");

    console.log("aigisCharacter done\n");
}

let missionListData;
let cardListData;
let classListData;
let skillListData;
let skillTextData;
let skillTypeData;
let skillInflData;
let abilityListData;
let abilityTextData;
let nameTextData;

const main = async function () {
    if (!fs.existsSync(resourcesPath)) { console.log("!fs.existsSync(resources)"); return; }

    console.log(`resourcesPath: ${resourcesPath}`);

    await downloadRawData();

    let missionListTxt = resourcesPath + "/missions.txt";
    let cardListTxt = resourcesPath + "/cards.txt";
    let classListTxt = resourcesPath + "/PlayerUnitTable.aar/002_ClassData.atb/ALTB_cldt.txt";
    let skillListTxt = resourcesPath + "/SkillList.atb/ALTB_skil.txt";
    let skillTextTxt = resourcesPath + "/SkillText.atb/ALTB_sytx.txt";
    let skillTypeTxt = resourcesPath + "/SkillTypeList.atb/ALTB_skty.txt";
    let skillInflTxt = resourcesPath + "/SkillInfluenceConfig.atb/ALTB_sytx.txt";
    let abilityListTxt = resourcesPath + "/AbilityList.atb/ALTB_aylt.txt";
    let abilityTextTxt = resourcesPath + "/AbilityText.atb/ALTB_aytx.txt";
    let nameTextTxt = resourcesPath + "/NameText.atb/ALTB_gdtx.txt";

    // let abilityCfgsTxt = resources + "/AbilityConfig.atb/ALTB_acfg.txt";

    missionListData = JSON.parse(fs.readFileSync(missionListTxt).toString().replace(/(,)(\s*)([\]\}])/g, (m, p1, p2, p3) => `${p2}${p3}`));
    cardListData = rawDataToJson(cardListTxt);
    classListData = rawDataToJson(classListTxt);
    skillListData = rawDataToJson(skillListTxt);
    skillTextData = rawDataToJson(skillTextTxt);
    skillTypeData = rawDataToJson(skillTypeTxt);
    skillInflData = rawDataToJson(skillInflTxt);
    abilityListData = rawDataToJson(abilityListTxt);
    abilityTextData = rawDataToJson(abilityTextTxt);
    nameTextData = rawDataToJson(nameTextTxt);

    await aigisChecker();
    await aigisTactics();
    await aigisMapHash();
    await aigisCharacter();


}; main();