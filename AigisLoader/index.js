// TODO:
// weather png

// require
const fs = require("fs");
const path = require("path");
const child_process = require('child_process');
const iconv = require("iconv-lite");
const Jimp = require('jimp');

// switch
const dlRaw = process.env.NODE_DLRAW == "false" ? false : true;
const dlImg = process.env.NODE_DLIMG == "false" ? false : true;

// vars
const workspaceFolder = `.`;
const aigisLoaderPath = `${workspaceFolder}/AigisLoader`;
const aigisToolPath = `${workspaceFolder}/AigisTools`;
const xmlPath = `${aigisToolPath}/out`;
const resourcesPath = `${xmlPath}/files`;
const rawListPath = `${xmlPath}/filelists/Desktop R Files.txt`;
const changesListPath = `${xmlPath}/Desktop R Changes.txt`;

// outputPath
const iconsOutputPath = `${workspaceFolder}/html/icons`;
const mapsOutputPath = `${workspaceFolder}/html/maps`;
const scriptOutputPath = `${workspaceFolder}/html/script`;

// method
const urlEncode = function (str_utf8, codePage) {
    let buffer = iconv.encode(str_utf8, codePage);
    let str = "";
    for (let i = 0; i < buffer.length; ++i) { str += "%" + buffer[i].toString(16); }
    return str.toLowerCase();   // .toUpperCase();
}
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }
global.sleep = async function (ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }
const cmdRmdirSync = async (path) => {
    if (!fs.existsSync(path)) { return true; }
    let cmd = `rmdir ${path.replace(/\//g, "\\")} /S /Q`;
    for (let i = 0; i < 3; ++i) {
        try {
            let r = child_process.execSync(cmd).toString();
            return r;
        } catch (e) {
            console.log(e);
        }
    }
    return false;
}
const COLOR = {
    reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
    underscore: '\x1b[4m', blink: '\x1b[5m', reverse: '\x1b[7m', hidden: '\x1b[8m',

    fgBlack: '\x1b[30m', fgRed: '\x1b[31m', fgGreen: '\x1b[32m', fgYellow: '\x1b[33m',
    fgBlue: '\x1b[34m', fgMagenta: '\x1b[35m', fgCyan: '\x1b[36m', fgWhite: '\x1b[37m',

    bgBlack: '\x1b[40m', bgRed: '\x1b[41m', bgGreen: '\x1b[42m', bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m', bgMagenta: '\x1b[45m', bgCyan: '\x1b[46m', bgWhite: '\x1b[47m',
};

// get local file list
const getFileList = function (dirPath, filter) {
    if (!filter) { filter = () => true; }
    if (!fs.existsSync(dirPath)) return [];

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
const getIconImage = function (filepath) {
    if (!filepath) { return undefined; }
    // console.log(`getIconMd5(${filepath})`)

    // get file id/type
    // C:\LineBot\AigisTools3.4\out\files\ico_01.aar\002_ico_00_unit_01.atx\frames\002_001.png
    let [, type, id] = filepath.match(/ico_(\d+)\.[\s\S]+\/(\d+)_001.png/);
    // console.log(`getIconImage(${filepath})`)

    // copy file
    let outputPath = `${iconsOutputPath}/${id}_${type}`;
    if (!fs.existsSync(outputPath)) {
        fs.createReadStream(filepath).pipe(fs.createWriteStream(outputPath));
    }

    return `${id}_${type}`;
}


let rawList = [];
let addedList = [];
let changesList = [];
const inChangelog = (fname) => { return changesList.length == 0 || addedList.includes(fname) || changesList.includes(fname); }

const downloadRawData = async () => {
    console.log(`downloadRawData start...`);

    // get_file_list.lua
    console.log("do get_file_list.lua");
    child_process.execSync(`do filelist`, { cwd: aigisToolPath }).toString().trim();

    // get filelist
    {
        {
            let filelist = fs.readFileSync(rawListPath).toString().split("\n");
            let listReg = /\S{40},\S{32},\S,\S{12},(\S+)/;

            for (let line of filelist) {
                if (!listReg.test(line)) { continue; }  // not match regex
                let [, filepath] = line.match(listReg);
                rawList.push(filepath);

                if (["EventNameText.atb",               // mission data
                    "PlayerUnitTable.aar", "NameText.atb", "AbilityList.atb", "AbilityText.atb",    // cards data
                    "SkillList.atb", "SkillText.atb", "SkillTypeList.atb", "SkillInfluenceConfig.atb",
                ].includes(filepath)) { changesList.push(filepath); }

                if (filepath.includes("QuestList.atb")) { changesList.push(filepath); }
                if (filepath.includes("MissionConfig.atb")) { changesList.push(filepath); }
                if (filepath.includes("MissionQuestList.atb")) { changesList.push(filepath); }

                // changesList.push("ico_00.aar");
                // changesList.push("ico_01.aar");
                // changesList.push("ico_02.aar");
                // changesList.push("ico_03.aar");
            }
        }
        if (fs.existsSync(changesListPath)) {
            let changelist = fs.readFileSync(changesListPath).toString().replace(/\r/g, "");

            let i = [
                changelist.indexOf('Added:\n'),
                changelist.indexOf('Removed:\n'),
                changelist.indexOf('Changed:\n'),
                changelist.length
            ].sort((a, b) => a - b)

            for (let j = 0; j < 3; ++j) {
                let filelist = changelist.substring(i[j], i[j + 1]).split("\n");
                let changetype = filelist.shift();
                let listReg = /^(\S+)\s+\S+/;

                for (let line of filelist) {
                    if (!listReg.test(line)) { continue; }  // not match regex
                    let match = line.match(listReg);

                    if (changetype == "Added:") {
                        addedList.push(match[1]);
                    } else if (changetype == "Changed:") {
                        changesList.push(match[1]);
                    }
                }
            }
        }
    }
    console.log(`Filelist: [${addedList.length}, ${changesList.length}]`);

    // check file of Interest
    rawList = rawList.filter((filename) => {
        if (/^Emc/i.test(filename)) { return false; }

        // mission data
        if (/MissionConfig\.atb/i.test(filename)) { return dlRaw; }
        if (/MissionQuestList\.atb/i.test(filename)) { return dlRaw; }
        if (/EventNameText\.atb/i.test(filename)) { return dlRaw; }
        if (/QuestNameText\d*\.atb/i.test(filename)) { return dlRaw; }
        // cards data
        if (/PlayerUnitTable\.aar/i.test(filename)) { return dlRaw; }
        if (/NameText\.atb/i.test(filename)) { return dlRaw; }
        if (/Ability(List|Text)\.atb/i.test(filename)) { return dlRaw; }
        if (/Skill(List|Text|TypeList|InfluenceConfig)\.atb/i.test(filename)) { return dlRaw; }

        //
        if (/Map\d+/i.test(filename)) { return dlImg; }
        if (/ico_\d+/i.test(filename)) { return dlImg; }

        // if (/BattleTalkEvent\d+/i.test(filename)) { return dlImg; }

        return false;
    });

    // del old version file
    rawList = rawList.filter((filename) => {
        if (inChangelog(filename)) {
            // data change, delete old version & download
            console.log(`rmdir ${resourcesPath}/${filename}`)
            cmdRmdirSync(`${resourcesPath}/${filename}`);
            return true;
        } else if (!fs.existsSync(`${resourcesPath}/${filename}`)) {
            // data no change but no old version, download
            return true;
        }
        // no old version + data change
        // old version exist + nochange
        // skip
        return false;
    });

    // call lua download
    rawList.sort();
    for (let filename of rawList) {
        console.log(`get file ${filename}`);
        try {
            child_process.execSync(`do file ${filename}`, { cwd: aigisToolPath });
        } catch (e) {
            // child_process.execSync(`start do file ${filename}`, { cwd: aigisToolPath });
            console.error(e.toString())
        }
    }

    // get cards
    console.log(`do xml GRs733a4`);
    child_process.execSync(`do xml GRs733a4 raw`, { cwd: aigisToolPath }).toString().trim();
    // get quests
    console.log(`do xml QxZpjdfV`);
    child_process.execSync(`do xml QxZpjdfV raw`, { cwd: aigisToolPath }).toString().trim();

    console.log(`downloadRawData done...\n`);
}

const xmlToJson = (filepath) => {
    console.log(`xmlToJson(${filepath})`)
    // get xml
    let raw = fs.readFileSync(filepath).toString();
    raw = raw.match(/<DA>(.+)<\/DA>/)[1];

    let result = [];

    // get keys
    let keyList = raw.match(/<[^>]+T=[^>]+>/gi);
    for (let keyStr of keyList) {
        // console.log(keyStr);
        // <CardID T="I">
        [, key, type] = keyStr.match(/<(\S+) T=\"(\S)\">/);
        // console.log(key, type);
        // [, "CardID", "I"]

        // get value array
        let valueStr = raw.substring(
            raw.indexOf(keyStr) + keyStr.length + 3,
            raw.indexOf(`<\/V></${key}>`)
        );
        let valueList = valueStr.split("<\/V><V>");
        // console.log(valueList)

        // set data to result
        for (let i = 0; i < valueList.length; ++i) {
            // build new item
            if (!result[i]) { result[i] = {}; }

            // set value type
            let value;
            if (type == "S") { value = valueList[i]; }
            if (type == "I") { value = parseInt(valueList[i]); }
            if (type == "F") { value = parseFloat(valueList[i]); }

            result[i][key] = value;
        }
    }
    return result;
}
// aigistool raw to json
const rawToJson = function (filepath) {
    // console.log(`rawToJson(${filepath})`)
    let raw = fs.readFileSync(filepath).toString().trim().split("\n");
    let result = [];

    // get keys
    let keyList = raw.shift().trim().split(/\s+/);
    for (let i = 0; i < raw.length; ++i) {
        // build new item
        if (!result[i]) { result[i] = {}; }

        // let valueList = ` ${raw[i]} `.match(/(\s"\S+"\s|\S+)/g)
        let valueList = [];
        let tmp = raw[i].trim().replace(/nil/g, "null");
        while (/[\S\s]+/.test(tmp)) {
            // if (/^"/.test(tmp)) {
            if (tmp.startsWith('"')) {
                let j = 1;
                while (j != -1) {
                    j = tmp.indexOf('"', j);
                    if (tmp[j - 1] == '\\') { j++; }
                    else { j++; break; }
                }

                valueList.push(tmp.substring(0, j));
                tmp = tmp.substring(j).trim();
            } else {
                let j = tmp.indexOf(` `);
                if (j == -1) j = tmp.length;
                valueList.push(tmp.substring(0, j));
                tmp = tmp.substring(j).trim();
            }
        }

        for (let j in keyList) {
            let key = keyList[j];
            let value = valueList[j];

            value = JSON.parse(value);
            // try { value = JSON.parse(value); }
            // catch (e) {
            //     console.log(`rawToJson(${filepath})`)
            //     console.log("\nJSON.parse(value)")
            //     console.log(`${value}`)
            //     console.log(valueList)
            // }

            result[i][key] = value;
        }
    }

    return result;
};



const aigisCardsList = async function () {
    console.log(`aigisCardsList start...`);

    // get icon png list
    let icons = [].concat(
        getFileList(resourcesPath + "/ico_00.aar"),
        getFileList(resourcesPath + "/ico_01.aar"),
        getFileList(resourcesPath + "/ico_02.aar"),
        getFileList(resourcesPath + "/ico_03.aar"))

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
                `${ps}${[p2, p4, p6].filter((p) => regSort.includes(p)).sort(regSortf).join("と").replace(/力/g, "")}${pe}`
            )
            .replace(reg2, (match, ps, p2, p3, p4, pe) =>
                `${ps}${[p2, p4].filter((p) => regSort.includes(p)).sort(regSortf).join("と").replace(/力/g, "")}${pe}`
            )

            .replace(/神魔法[\s]回復の雨/g, "神魔法・回復の雨")
            .replace(/(「.*)(\s)(.*」)/g, (match, p1, p2, p3) => `${p1}${p3}`)
            .replace(/@/g, "　");
    }

    let getSkillData = function (card, skillID, skillIDList = [skillID]) {
        let skillData = { name: [], text: [] };
        if (skillID == 0) { return skillData; }

        // get skill obj
        let skill = skillListRaw[skillID] || { ID_Text: 0 };    // SkillList.atb
        let text = skillTextRaw[skill.ID_Text];                 // SkillText.atb
        if (!skill || !text) {
            return {
                name: [skill ? skill.SkillName : `SkillID_${skillID}`],
                text: [text ? text.Data_Text : `Data_Text_${skill.ID_Text}`],
            };
        }

        text = text.Data_Text.replace(/[\s]*\n[\s]*/g, "\n");
        // text = text.Data_Text.replace(/[\n ]+/g, "\n");

        // get skill base data
        let name = skill.SkillName;
        let nextSkill = 0;
        let POW = skill.PowerMax;
        let type = skillTypeRaw.find(ele => ele.SkillTypeID == skill.SkillType);

        // text replace
        text = text.replace("(現在[NUM_TARGET]体)", "").replace("(現在[NUM_SHOT]回)", "");
        text = text.replace("[NUM_TARGET]", "X").replace("[NUM_SHOT]", "X");
        text = text.replace("<TIME>", skill.ContTimeMax);
        text = text.replace("<HERO_POW>", 12);
        text = text.replace(/コストｰ/g, "コスト-");
        text = text.replace(/%/g, "％");

        // debug flag
        let debug = false;
        // debug ||= ([1064, 1194, 1309, 1394, 1459].includes(card.CardID));
        // debug ||= ([2852].includes(skillID));
        // debug ||= (skill.SkillName.includes("悲哀のエンドロール"));
        // debug ||= (skill.SkillName.includes("血のカーテンコール"));
        // debug ||= (skill.SkillName.includes("終わらないレクイエム"));
        // debug ||= (skill.SkillName.includes("ラウドリーバラッド"));
        // debug ||= (skill.SkillName.includes("招福のいたずら"));
        // debug ||= (skill.SkillName.includes("夏・暗黒オーラ"));
        // debug ||= (skill.SkillName.includes("渇きの夜は終わらず"));
        // debug ||= (skill.SkillName.includes("ラウドリーバラッド"));
        if (debug) {
            console.log(`======`);
            console.log(`${name}\t skill ID: ${skillID}, card ID: ${card.CardID}`);
            console.log(text);
        }


        // get skill influence
        let influenceRaw = [];
        for (let i = skillInfluenceRaw.findIndex(ele => ele.Data_ID == type.ID_Influence); i < skillInfluenceRaw.length; ++i) {
            let _infl = skillInfluenceRaw[i];
            if (_infl.Data_ID != 0 && _infl.Data_ID != type.ID_Influence) { break; }
            influenceRaw.push(_infl);
        }

        // for  eval(iExpression);
        if (skillID == 1659) { var HasAbiInf = () => { return false; }; }

        influenceRaw = influenceRaw.filter(ele => {
            let iExpression = ele._ExpressionActivate;
            if (skillID == 1346 && ele.Data_InfluenceType == 83) { return false; }
            if (skillID == 663 && ![2, 89].includes(ele.Data_InfluenceType)) { return false; }
            if (ele.Data_InfluenceType == 6 && [326, 673, 1307, 1456, 1457].includes(skillID)) { return false; }
            if ([1027, 1028, 1029].includes(skillID) && ele.Data_InfluenceType == 2) { return false; }
            if (iExpression == "") { return true; }

            iExpression = iExpression
                .replace(/＝/g, `=`)
                .replace(/IsCardID/g, `${card.CardID} == `)
                .replace(/IsSkillID/g, `${skillID} == `)
                .replace(/IsClassID/g, `${card.InitClassID} == `)
                .replace(/GetClassID\(\)/g, card.InitClassID)

                .replace(/GetClassChange\(\)/g, 2)          // 覺醒值 0~4
                .replace(/IsMoreClassChange\(2\)/g, true)   // 覺醒 Y/N?

                .replace(/IsClassType\([^\)]+\)/g, false)  // 特定職業條件
                .replace(/GetUnitInBattleMatchCount\([\S\s]+\)\s*[>=]{2}\s*\d{1}/g, true)  // 滿足特定條件的人數
                .replace(/CheckUnitInBattleSomeMatch\(.+\(\).+\)/g, true)  // 滿足特定條件的人數
                .replace(/GetEntryUnitCount\(\)/g, 6)  // 下場人數
                .replace(/GetSysVer\(\)\s*[<=>]+\s*\d+/g, false)
                .replace(/GetSallyCount\(\)\s*[<=>]+\s*\d+/g, false);

            try {
                return eval(iExpression);
            } catch (e) {
                console.log(skillID, iExpression)
                throw e;
            }
        });
        influenceRaw.sort((iA, iB) => (iB.ExtendProperty != "") - (iA.ExtendProperty != ""))
        if ([1536, 2001, 2207, 2226, 2227, 2261, 2574, 2948, 2950].includes(skillID)) {
            // influenceRaw.reverse();
            influenceRaw = influenceRaw.splice(influenceRaw.indexOf(influenceRaw.find(e => e.Data_InfluenceType == 11)), 1).concat(influenceRaw);
        }
        if (skillID == 2852) {
            influenceRaw.find(e => e.ExtendProperty != "").ExtendProperty = "";
            influenceRaw.push(influenceRaw.splice(influenceRaw.indexOf(influenceRaw.find(e => e.Data_InfluenceType == 2)), 1)[0]);
            influenceRaw.push(influenceRaw.splice(influenceRaw.indexOf(influenceRaw.find(e => e.Data_InfluenceType == 4)), 1)[0]);
        }


        // get infl data
        let inflRaw = [];
        for (let influence of influenceRaw) {

            const iType = influence.Data_InfluenceType;
            let desc = "";
            {
                let m1 = influence.Data_MulValue;
                let m2 = influence.Data_MulValue2;
                let m3 = influence.Data_MulValue3;
                let a1 = influence.Data_AddValue;
                let m4 = influence._HoldRatioUpperLimit;

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
                        if ([3, 5].includes(iType)) {
                            pow_string = `(${pow_string}) - 1`;
                        }
                    }
                    if (!pow_string && [12, 13].includes(iType)) {
                        pow_string = a1 + 1;
                    }
                    desc = eval(pow_string);    // POW
                    if (desc == 1.0 && a1 != 0) { desc = a1; }
                }
                if (iType == 49) { nextSkill = a1; }
            }

            // extend tag
            let [, extend] = (influence.ExtendProperty.startsWith("Tag")) ? influence.ExtendProperty.match(/\S+=(\S+)/) : [, null];
            let ext2 = null;

            if (iType == 6) {
                if (card.InitClassID == 12500) { desc = Math.round(desc / 0.115) / 10; }
                if (!extend && text.includes("<RNG>")) { extend = "<RNG>"; }
            }

            if (extend) {
                let _ext2 = extend.replace('[', '<').replace(']', '>');
                if (_ext2 != extend) { ext2 = _ext2; }
                extend = [extend];
            } else {
                // iType == 187 即死
                if (iType == 2) { extend = ['<ATK>', '<POW_R>', '<PATK>', '[ATK]']; }   // ATK                                    
                if (iType == 4) { extend = ['<DEF>', '<POW_R>', '<PDEF>', '[DEF]']; }   // DEF                                    
                if (iType == 3) { extend = ['<ATK>', '<POW_I>', '[ATK]', '<POW_R>']; }             // ALL ATK                          
                if (iType == 5) { extend = ['<DEF>', '<POW_I>', '[DEF]', '<POW_R>']; }             // ALL DEF                          
                if (iType == 6) { extend = ['<RNG>', '<POW_R>']; }                      // ALL DEF                 
                if (iType == 7) { extend = ['<NUM_SHOT>']; }
                if (iType == 8) { extend = ['<AREA>', '<POW_R>']; }
                if (iType == 9) { extend = ['<AVOID>', '<POW_I>']; }
                if (iType == 10) { extend = ['<AVOID>']; }
                if (iType == 11) { extend = ['<POW_R>']; }                              // HP         
                if (iType == 12) { extend = ['<NUM_BLOCK>']; }
                if (iType == 13) { extend = ['<NUM_ATK>']; }
                if (iType == 19) { extend = ['<MDEF>', '<POW_R>']; }
                if (iType == 22) { extend = ['<NUM_TRG>']; }
                if (iType == 31) { extend = ['<POW_I>']; }                              // HEAL         
                if (iType == 32) { extend = ['<POW_I>']; }                              // ADD COST         
                if (iType == 33) { extend = ['<POW_I>']; }                              // PH DEF%         
                if (iType == 34) { extend = ['<MDEF>']; }                               // MDEF        
                if (iType == 35) { extend = ['<POW_I>']; }                              // ATK+HP         
                if (iType == 37) { extend = ['<POW_I>']; }                              // ATK DEBUFF         
                if (iType == 54) { extend = ['<POW_I>']; }                              // LUK DEF         
                if (iType == 83) { extend = ['<POW_R>']; }
                if (iType == 83) { extend = ['<POW_I>', '<POW_R>']; }                   // MAX HP         
                if (iType == 85) { extend = ['<POW_R>']; }
                if (iType == 89) { extend = ['<ATK>', '<POW_R>', '[ATK]']; }
                if (iType == 90) { extend = ['<DEF>', '<POW_R>', '[DEF]']; }
                if (iType == 103) { extend = ['<POW_I>']; }                             // ATK DEBUFF          
                if (iType == 105) { extend = ['<POW_I>']; }                             // UNKNOWN          
                if (iType == 108) { extend = ['<POW_I>']; }                             // HP CUT          
                if (iType == 137) { extend = ['<POW_R>']; }                             // AB BUFF          
                if (iType == 141) { extend = ['<ATK>', '<POW_R>', '[ATK]']; }
                if (iType == 142) { extend = ['<DEF>', '<POW_R>', '[DEF]']; }
                // if (iType == 173) { extend = ['[NUM_SHOT]']; }
                if (iType == 178) { extend = ['<POW_I>']; }
                if (iType == 200) { extend = ['<RNG>']; }
                if (iType == 226) { extend = ['<POW_R>']; }
            }

            let infl = { iType, extend: extend || [], ext2, desc };
            inflRaw.push(infl);

            // debug msg
            if (debug) { console.log(`${name}\t iType: ${iType}\t desc: ${desc}    Exten: ${influence.ExtendProperty}, [${infl.extend.join(', ')}]`); }
        }


        // get var from text
        let variables = text.match(/((?:\<[A-Z_]+\>|\[[A-Z_]+\])[倍％]?)/ig) || [];
        for (let varString of variables) {

            let replaced = false;
            let inflRaw2 = [];
            for (let infl of inflRaw) {
                let { iType, extend, ext2, desc } = infl;

                for (let ext of extend) {
                    if (ext === null) { continue; }
                    if (!varString.includes(ext)) { continue; }

                    if (desc === null) { continue; }
                    // get desc
                    let res = '', desc100 = Math.round(desc * 100);
                    if (varString.endsWith(`倍`)) {
                        res = ([3, 5].includes(iType) && !ext.includes('_R')) ? (Math.round((desc + 1) * 100) / 100) : desc;
                    } else if (varString.endsWith(`％`)) {
                        res = (iType == 89) ? (desc100 - 100) : desc100;
                    } else {
                        res = (iType == 32) ? (res = desc100) : desc;
                    }

                    text = text.replace(ext, res);
                    if (debug) { console.log(`[${variables.indexOf(varString)}/${variables.length}]`, varString, `iType: ${iType},`, `replace:`, ext, `${res}`); }
                    replaced = true;
                    break;
                }

                if (replaced) {
                    inflRaw.splice(inflRaw.indexOf(infl), 1);
                    break;
                } else {
                    inflRaw2.push(infl);
                }
            }

            if (!replaced) {
                for (let infl of inflRaw2) {
                    let { iType, extend, ext2, desc } = infl;
                    if (ext2 === null) { continue; }
                    if (!varString.includes(ext2)) { continue; }

                    if (desc === null) { continue; }
                    // get desc
                    let res = '', desc100 = Math.round(desc * 100);
                    if (varString.endsWith(`倍`)) {
                        res = ([3, 5].includes(iType) && !ext2.includes('_R')) ? (Math.round((desc + 1) * 100) / 100) : desc;
                    } else if (varString.endsWith(`％`)) {
                        res = (iType == 89) ? (desc100 - 100) : desc100;
                    } else {
                        res = (iType == 32) ? (res = desc100) : desc;
                    }

                    text = text.replace(ext2, res);
                    if (debug) { console.log(`[${variables.indexOf(varString)}/${variables.length}]`, varString, `iType: ${iType},`, `replace:`, ext2, `${res}`); }
                    replaced = true;
                    inflRaw.splice(inflRaw.indexOf(infl), 1);
                    continue;
                }
            }
        }

        text = textFormat(text);

        // skillData = { name: [], text: [] };
        skillData.name.push(name);
        skillData.text.push(text);

        // if (debug) {
        //     console.log('debug')
        // }

        if (nextSkill != 0 && nextSkill != card.ClassLV1SkillID && !skillIDList.includes(nextSkill)) {
            let nextSkillData = getSkillData(card, nextSkill, skillIDList.concat([nextSkill]));
            // skillData.name = skillData.name.concat(nextSkillData.name);
            // skillData.text = skillData.text.concat(nextSkillData.text);
            for (let i = 0; i < nextSkillData.name.length; ++i) {
                let iName = nextSkillData.name[i];
                let iText = nextSkillData.text[i];
                if (!skillData.name.includes(iName) || !skillData.text.includes(iText)) {
                    skillData.name.push(iName);
                    skillData.text.push(iText);
                }
            }
        }

        if (debug) { console.log(``); }

        return skillData;
    };

    let getAbilityData = function (abilityID) {
        let abilityData = { name: "", text: "" };
        if (abilityID == 0) { return abilityData; }

        let al = abilityListRaw[abilityID] || { AbilityTextID: 0 };
        let at = abilityTextRaw.find(e => e.AbilityTextID == al.AbilityTextID)
        if (!al || !at) return { name: `AbilityID_${abilityID}`, text: "" };

        abilityData.name = al.AbilityName;
        abilityData.text = textFormat(at.AbilityText.replace("%d", al.AbilityPower));

        return abilityData;
    };


    // result
    let rawCardsList = [];
    let charaDatabase = [];

    for (i in _GRs733a4) {

        let card = _GRs733a4[i];
        if (!nameListRaw[i]) { console.log(`${COLOR.fgRed}Cant found CardID == ${i + 1}${COLOR.reset}`); continue; }
        let _class = classListRaw.find(e => e.ClassID == card.InitClassID);
        if (!_class) { console.error(`${COLOR.fgRed}Cant found ClassID == ${card.InitClassID}${COLOR.reset}`); continue; }

        // rawCardsList.js
        {
            let id = card.CardID;   // id = i + 1
            let name = nameListRaw[i].Message;
            let rare = card.Rare;
            let classID = card.InitClassID;
            let sortGroupID = _class.SortGroupID;
            // 10: 聖霊, 20: 近接, 25: 王子, 30: 遠隔, 40: 兩用
            let placeType = _class ? _class.PlaceAttribute : 0;  // PlaceAttribute
            // 0: 不可放置, 1: 近接, 2: 遠隔, 3: 兩用
            let kind = card.Kind;
            // 0: 男性, 1: 女性, 2: 無性(?), 3: 換金, 2: 經驗
            let assign = card.Assign;
            // 1: 王國, 2: 帝國, 3-4: 遠國, 5: 砂漠, 6-7: 異鄉, 8: 東國, 9: 華の国, 10: 恋姫
            let genus = card.Genus;
            // 101: 新春, 102: 情人, 103: 學園, 104: 花嫁, 105: 夏季
            // 106: 萬聖, 107: 聖夜, 108: Q, 109: 溫泉, 110: エッグハント

            let year = new Date(card.DateOfImplementation).getFullYear();
            let isEvent = (card._TradePoint <= 15) ? 1 : 0; // _TradePoint
            let isToken = (card.SellPrice == 0 || nameListRaw[i].Message.includes("ダミー") || nameListRaw[i].RealName.includes("NPC")) ? 1 : 0;

            // Collaboration data format
            switch (id) {
                // ランス10-決戦-
                case 581: case 1758: case 1759: case 1760: case 1761:
                case 2155: case 2156: case 2157: case 2158: case 2159: case 2162:
                    { assign = -1; } break;

                // // 真・恋姫†夢想-革命
                // case 648: case 649: case 650: case 651: case 652:   // 2018/07
                // case 848: case 849: case 850: case 851: case 852:   // 2019/08
                //     { assign = -2; } break;

                // 超TD
                case 1658: case 1659: case 1808: case 1809: case 1975:
                case 2074: case 2075: case 2270: case 2271:
                    { assign = -2; } break;

                // 封緘のグラセスタ
                case 719:
                case 720: { assign = -3; } break;

                // ガールズ・ブック・メイカー（GBM）
                case 815: case 816: case 817: case 818: case 819:   // 2019/06
                case 1015: case 1016: case 1017: case 1018: // 2020/06
                    { assign = -4; } break;

                // 流星ワールドアクター
                case 955: case 956: { assign = -5; } break;

                // case 497: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（遠国の近衛兵）"; } break;
                // case 498: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（遠国の前衛戦術家）"; } break;
                // case 499: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（遠国の弓兵）"; } break;
                // case 501: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（遠国の公子）"; } break;
                // case 684: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（異郷の槌使い）"; } break;
                // case 685: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（異郷の盗賊）"; } break;
                // case 686: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（異郷の回復術士）"; assign = 6; } break;
                // case 687: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（異郷の騎士）"; } break;
                // case 688: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（異郷の妖精）"; } break;
                // case 689: { name = name.replace(/(（[\S]+の[\S]+）)/g, "") + "（異郷の祝福者）"; assign = 6; } break;
                case 686: case 689: { assign = 6; } break;

                case 694: case 697: { assign = 7; } break;

                // なないろリンカネーション
                case 1206: case 1207: case 1208: case 1209:
                case 1210: case 1211: case 1212:
                case 1214: case 1215: case 1216:
                    { assign = -6; } break;

                // 対魔忍RPG
                case 1864: case 1865: case 1866: case 1867:
                case 1868: case 1869: case 1870: case 1871:
                case 1872: case 1873: case 1864:
                    { assign = -7; } break;
            }

            // check name
            if (id == 1135) {
                name = "王子【ナンディ】";
                subName = "王子ナンディ";
            }
            if (id == 1246) {
                name = "王子【海鎮】";
                subName = "王子海鎮";
            }
            if (name.includes("王子")) {
                let match = name.match(/(\S+)強化\d/);
                if (match) { name = match[1]; }
            }
            if ([1853, 1967, 1968, 1969].includes(id)) {
                sortGroupID = 25;
            }


            // get image md5&get giles
            let img, imgaw, imgaw2A, imgaw2B;
            let iconName = "/" + id.toString().padStart(3, "0") + "_001.png";
            img = getIconImage(icons.find(file => (/ico_00\.aar/.test(file) && file.indexOf(iconName) != -1)));
            imgaw = getIconImage(icons.find(file => (/ico_01\.aar/.test(file) && file.indexOf(iconName) != -1)));
            imgaw2A = getIconImage(icons.find(file => (/ico_02\.aar/.test(file) && file.indexOf(iconName) != -1)));
            imgaw2B = getIconImage(icons.find(file => (/ico_03\.aar/.test(file) && file.indexOf(iconName) != -1)));

            // no any img
            // if (!img && !imgaw && !imgaw2A && !imgaw2B) { continue; }
            if (!img && !imgaw && !imgaw2A && !imgaw2B) { img = "c80ae4db8b6b09123493ceea8b63ccc2"; }

            // 
            if ([363, 406, 468, 666, 1047, 1048, 1049, 1078, 1112, 1136, 1202].includes(id)) {
                img = `${id.toString().padStart(3, "0")}_00`
            }
            if ([1078].includes(id)) {
                imgaw = `${id.toString().padStart(3, "0")}_01`
            }

            let _obj = rawCardsList.find((obj) => obj &&
                obj.name == name &&
                obj.rare == rare &&
                obj.isToken == isToken);
            if (_obj) {
                if (img != "c80ae4db8b6b09123493ceea8b63ccc2") {
                    rawCardsList[_obj.id] = {
                        id: _obj.id,
                        name, rare, classID: _obj.classID,
                        sortGroupID, placeType,
                        kind, assign, genus, // identity,
                        year: _obj.year, isEvent, isToken,
                        img, imgaw, imgaw2A, imgaw2B
                    };
                }
            } else {
                let obj = {
                    id,
                    name, rare, classID,
                    sortGroupID, placeType,
                    kind, assign, genus, // identity,
                    year, isEvent, isToken,
                    img, imgaw, imgaw2A, imgaw2B
                };
                rawCardsList[id] = obj;
            }

            // if (id)
        }

        // // CharaDatabase.json
        {
            // data
            let id = card.CardID;   // id = i + 1
            let kind = card.Kind;
            // 0: 男性, 1: 女性, 2: 無性(?), 3: 換金, 2: 經驗
            let isToken = (card.SellPrice == 0 || nameListRaw[i].Message.includes("ダミー")) ? 1 : 0;

            if ([1377, 1378, 1379,
                1380, 1381, 1382,
                1383, 1384, 1385,
                1386, 1387, 1388
            ].includes(card.CardID)) continue;

            // db data
            let name = nameListRaw[i].Message;
            let subName = nameListRaw[i].RealName;
            if (id == 1) {
                name = "王子【通常】";
                subName = "王子";
            }
            if (id == 1135) {
                name = "王子【ナンディ】";
                subName = "王子ナンディ";
            }
            if (id == 1246) {
                name = "王子【海鎮】";
                subName = "王子海鎮";
            }
            if (name.includes("王子")) {
                let match = name.match(/(\S+)強化\d/);
                if (match) { name = match[1]; }
            }
            if (card.Rare > 7 && kind != 2) {
                name += (card.Rare == 10) ? "【白金英傑】" : "【黒英傑】";
            }


            let urlName;
            {
                let url = name;
                // if (card.CardID == 660)) { url = url.replace(/\s/g, ""); }
                if (/聖霊/.test(url) && card.InitClassID < 50) { url = "特殊型"; }
                if ([1, 309, 552, 554, 563, 604, 644, 690, 741, 771, 775, 782, 929, 950].includes(card.CardID)) { urlName = "%b2%a6%bb%d2"; }
                else if (card.CardID == 4) { urlName = "%bb%b3%c2%b1%20%bc%ea%b2%bcA"; }
                else if (card.CardID == 67) { urlName = "%bb%b3%c2%b1%20%bc%ea%b2%bcB"; }
                else if (card.CardID == 435) { urlName = "%bc%f2%c6%dd%c6%b8%bb%d2%a4%ce%cc%bc%b5%b4%bf%cf%c9%b1"; }
                else if (card.CardID == 547) { urlName = "%cd%c5%b8%d1%c2%c4%c9%b1"; }
                else if (card.CardID == 661) { urlName = "%c0%e9%ce%be%a4%ab%a4%d6%a4%ad%c9%b1%b9%c8%b2%b4%c3%b0"; }
                else if (card.CardID == 730) { urlName = "%c7%af%b2%ec%a4%ce%c3%e5%b0%e1%bb%cf%20%b5%b4%bf%cf%c9%b1"; }
                else { urlName = urlEncode(url, "EUC-JP"); }
            }


            let rarity = {
                0: "アイアン", 1: "ブロンズ", 2: "シルバー",
                3: "ゴールド", 4: "プラチナ", 5: "ブラック", 7: "サファイア",
                10: "プラチナ", 11: "ブラック"  // 英傑
            }[card.Rare];


            let awclass = false;
            let className = _class.Name;
            if (kind == 2) { className = "聖霊" }
            if (name.indexOf("王子") != -1) { className = "王子"; awclass = true; }
            if (className.indexOf("ちび") != -1) {
                _class = classListRaw.find(e => e.Name == className.replace("ちび", "")) || _class;
                while (true) {
                    let tmp = classListRaw.find(e => e.JobChange == _class.ClassID && e.ClassID != 700);
                    if (tmp) { _class = tmp; awclass = true; }
                    else break;
                }
                className = _class.Name;
            }
            if (/^[下中]級/.test(className)) { className = className.replace(/^[下中]級/, ""); }


            // skill/AB
            let ability, ability_aw, skill = "", skill_aw = "";
            let _ability, _ability_aw, _skill, _skill_aw;
            let abID = card.Ability_Default;
            let awID = card.Ability || abID;
            let skID = card.ClassLV1SkillID || card.ClassLV0SkillID;
            let swID = card.EvoSkillID || skID;

            if (card.Rare <= 1) { awID = 0; swID = 0; }
            if (card.Rare <= 2) { swID = 0; }
            if (card.Rare >= 10) { abID = 0; }
            if (awclass) { abID = 0; skID = 0; }
            else if (name.startsWith("ちび")) { awID = 0; swID = 0; }
            if (awID == abID) { awID = 0; }
            if (swID == skID) { swID = 0; }
            if (name == "刻聖霊ボンボリ") { skID = 0; }

            _ability = getAbilityData(abID);
            _ability_aw = getAbilityData(awID);
            _skill = getSkillData(card, skID);
            _skill_aw = getSkillData(card, swID);

            if (_skill.name) for (let i in _skill.name) { skill += `▹${_skill.name[i]}\n${_skill.text[i]}\n`; };
            if (_skill_aw.name) for (let i in _skill_aw.name) { skill_aw += `▸${_skill_aw.name[i]}\n${_skill_aw.text[i]}\n`; };
            skill = skill.trim();
            skill_aw = skill_aw.trim();

            ability = !!_ability.name ? `▹${_ability.name}\n${_ability.text}` : "";
            ability_aw = !!_ability_aw.name ? `▸${_ability_aw.name}\n${_ability_aw.text}` : "";


            // skip data
            if (isToken) continue;
            // if (name == "刻聖霊ボンボリ" && i != 289) continue;

            let _obj = charaDatabase.find((obj) => obj.name == name);
            if (_obj) {
                let id = charaDatabase.indexOf(_obj);
                let obj = _obj;
                obj.ability ||= ability;
                obj.ability_aw ||= ability_aw;
                obj.skill ||= skill;
                obj.skill_aw ||= skill_aw;
                charaDatabase[id] = obj;
            } else {
                let obj = {
                    name, subName,
                    ability, ability_aw,
                    skill, skill_aw,
                    urlName,
                    rarity, class: className
                };
                charaDatabase.push(obj);
            }
        }

    }
    rawCardsList = rawCardsList.filter((r) => (r));   // del empty item

    // ready to write to file
    let cardsDataString = [];
    for (let result of rawCardsList) {
        cardsDataString.push("\t" + JSON.stringify(result, null, 1).replace(/\s*\n\s*/g, "\t"));
    };
    // write to file
    fs.writeFileSync(`${scriptOutputPath}/rawCardsList.js`, `var maxCid = ${_GRs733a4.length};\nvar charaData = [\n${cardsDataString.join(",\n")}\n]`);
    console.log("fs.writeFileSync( rawCardsList.js )");

    // write to file
    fs.writeFileSync(`${aigisLoaderPath}/CharaDatabase.json`, JSON.stringify(charaDatabase, '\t', 1));
    console.log("fs.writeFileSync( CharaDatabase.json )");

    console.log(`aigisCardsList done...\n`);
}

const aigisQuestsList = async () => {
    console.log(`aigisQuestsList start...`);

    /*  class mission {
            "MissionID": 0,
            "Name": "",
            "QuestID": []
        }
    
        class quest {
            "QuestID": 0,
            "Name": "",
            "map",
            "location", "life", "startUP", "unitLimit";
        }*/

    // missionLists
    let missionList = [];
    let questList = [];
    let mapLocationList = {};

    // *MissionConfig.atb
    // read raw mission config
    // get object > mission { MissionID, Name, QuestID }
    {
        // download mission name Text
        let missionNameText = [];
        {
            let filepath = resourceList.find(p => p.includes("EventNameText") && p.endsWith("ALTB_entx.txt"));
            missionNameText = rawToJson(filepath);
            console.log(`get EventNameText data`);
        }

        let missionCfgPath = resourceList.filter(p => p.includes("MissionConfig") && !p.startsWith("Emc"));
        for (let filepath of missionCfgPath) {
            let missionCfgArray = rawToJson(filepath);

            for (let missionCfg of missionCfgArray) {

                let titleID = missionCfg.TitleID;
                let _name = missionCfg.Name || ((titleID != undefined) ? missionNameText[titleID].Data_Text : null) || "NULL";
                let missionID = missionCfg.MissionID;

                let questID = missionCfg.QuestID || missionCfg.QuestIdList || false;
                questID = questID ? questID.split(',') : [];
                for (let i in questID) { questID[i] = parseInt(questID[i]); }

                // fill mission title
                if (missionID < 110000) {
                    _name = [
                        "第一章　王都脱出", "第二章　王城奪還", "第三章　熱砂の砂漠", "第四章　東の国", "第五章　魔法都市",
                        "第六章　密林の戦い", "第七章　魔の都", "第八章　魔神の体内", "第九章　鋼の都", "第十章　海底",
                        "第十一章　ポセイオス"
                    ][missionID - 100001] || "NULL";
                }

                // search mission in db
                let mission = missionList.find(q => q.missionID == missionID || q.name == _name);
                if (!mission) {
                    // buind new mission
                    mission = { name: _name, missionID, questID };
                    missionList.push(mission);
                } else {
                    mission.name = _name;
                    mission.missionID = missionID;
                    mission.questID = mission.questID.concat(questID);
                    mission.questID = mission.questID.filter((e, i) => mission.questID.indexOf(e) === i);
                }
            }
        }
    }; console.log(`get MissionConfig data`);

    // *MissionQuestList.atb
    // read raw mission quest list
    // fill mission.QuestID
    {
        let missionQListPath = resourceList.filter(p => p.includes("MissionQuestList"));
        for (let filepath of missionQListPath) {
            let missionQListArray = rawToJson(filepath);

            for (let missionQList of missionQListArray) {

                let missionID = missionQList.MissionID;
                let questID = missionQList.QuestID;

                // search mission in db
                let mission = missionList.find(q => q.missionID == missionID)
                if (mission) {
                    if (!mission.questID.includes(questID)) {
                        mission.questID.push(questID);
                    }
                } else {
                    // console.log(filepath);
                    // console.log(`${COLOR.fgRed}cant found missionID = ${missionID}${COLOR.reset}`);
                }
            }
            // // backup file
            // let listName = path.parse(filepath).dir;
            // listName = path.parse(listName).name;
            // fs.writeFileSync(`raw/MissionQuestList/${listName}.json`, JSON.stringify(questList, null, 2));
        }
    }; console.log(`get MissionQuestList data`);
    // mission list done...


    // QxZpjdfV.xml
    // read raw quest list
    {
        for (let questRaw of _QxZpjdfV) {
            // get data from raw
            let questID = questRaw.QuestID;
            let map = questRaw.MapNo.toString().padStart(4, "0");
            let location = questRaw.LocationNo.toString().padStart(2, "0");;
            let entry = questRaw.EntryNo.toString().padStart(2, "0");;
            let life = questRaw.defHP;
            let startUP = questRaw.defAP;
            let unitLimit = questRaw.Capacity;

            // get data from db
            let missionID = missionTitle = "NULL";

            for (let mission of missionList.filter(m => m.questID.includes(questID))) {
                missionID = mission.missionID;
                missionTitle = mission.name;

                let mapRegex = new RegExp(`Map${missionID}_${map}\.aar.*\.png$`, 'i');
                if (resourceList.find(p => mapRegex.test(p))) {
                    map = `${missionID}_${map}`;
                    break;
                }
            }

            // get quest name text
            let questName = "NULL";
            if (missionID != "NULL") {
                let filepath = resourceList.find(p => p.includes(`QuestNameText${missionID}.atb`));
                let questNameText = rawToJson(filepath);

                let questNameID = questRaw.QuestTitle;
                // console.log(`get file QuestNameText${missionID}.atb`, questNameID, questNameText[questNameID])

                if (!questNameText[questNameID]) {
                    console.log(questNameID);
                    console.log(filepath);
                    console.log("get file");
                }

                questName = questNameText[questNameID].Message;
                questName = questName.replace(/%c\[\S{6}\]/g, '');
            }

            // buind new quest
            if (missionID != "NULL") {
                let quest = {
                    id: `${missionID}/${questID}`, map,
                    missionTitle, questName,
                    missionID, questID,
                    location, entry,
                    life, startUP, unitLimit
                }
                questList.push(quest);
            }
        }
    }; console.log(`get QuestNameText data`);

    // aigis data bug, HistoryMissionConfig.atb != HistoryMissionQuestList.atb when mID = [920125, 920124]
    for (let mission of missionList) {
        if (mission.missionID == 920124) { mission.questID = mission.questID.filter((qID) => ![6727, 6728, 6729, 6730, 6731, 6732].includes(qID)); }
        if (mission.missionID == 920125) { mission.questID = mission.questID.filter((qID) => ![6714, 6715, 6716, 6717, 6718, 6719, 6720, 6721, 6722, 9059].includes(qID)); }
    }

    // get old quest list
    if (fs.existsSync(`${aigisLoaderPath}/QuestList.json`)) {
        let oldQuestList = fs.readFileSync(`${aigisLoaderPath}/QuestList.json`).toString();
        oldQuestList = oldQuestList.substring(oldQuestList.indexOf('['));
        oldQuestList = eval(oldQuestList);
        for (let quest of oldQuestList) {
            if (!questList.find(q => q.questID == quest.questID)) {
                let oldQuest = {
                    id: quest.id,
                    map: quest.map,
                    missionTitle: quest.missionTitle,
                    questName: quest.questName,
                    missionID: quest.missionID,
                    questID: quest.questID,
                    location: quest.location,
                    entry: quest.entry || null,
                    life: quest.life,
                    startUP: quest.startUP,
                    unitLimit: quest.unitLimit,
                }
                questList.push(oldQuest);
                // console.log(quest.questID)
            }
        }
    }
    // quest list done...


    // download map data/image
    {
        let oldLocationList = {};
        if (fs.existsSync(`${aigisLoaderPath}/MapLocationList.json`)) {
            oldLocationList = fs.readFileSync(`${aigisLoaderPath}/MapLocationList.json`).toString();
            oldLocationList = oldLocationList.substring(oldLocationList.indexOf('{'));
            oldLocationList = eval(`(${oldLocationList})`);
        }

        for (let quest of questList) {
            // quest config
            let map = quest.map;
            let location = quest.location;
            let entry = quest.entry;

            // resource path
            let fileName = `Map${map}`;
            let outputPath = `${mapsOutputPath}/${fileName}`;

            // online file name/path
            let mapName = `Map${map}.aar`;
            let raws = getFileList(`${resourcesPath}/${mapName}`)
            // pick map data path
            let pngPath = raws.find(p => p.endsWith(".png"));

            // online file exist
            if (pngPath && (!fs.existsSync(outputPath) || changesList.indexOf(mapName) != -1) && dlImg) {
                // online path + no local resource
                // online path + in change log

                // convert new map png to jpg
                await new Promise((resolve, reject) => {
                    Jimp.read(pngPath)
                        .then(img => {
                            console.log(` getting ${fileName} map image...`);
                            return img.quality(70) // set JPEG quality
                                .write(outputPath + ".jpg"); // save
                        }).then(async () => {
                            console.log(" Jimp.quality(70).write()");

                            await sleep(100);
                            // del old local resource if exist
                            if (fs.existsSync(outputPath)) { fs.unlinkSync(outputPath); }
                            // rename
                            let log = child_process.execSync(`ren ${fileName}.jpg ${fileName}`, { cwd: mapsOutputPath }).toString().trim();
                            if (log != "") console.log(log);

                            console.log("");
                            resolve();
                        }).catch(err => {
                            console.log(pngPath);
                            console.error(err);
                            // reject();
                            resolve();
                        });
                });
            } else if (!pngPath && !fs.existsSync(outputPath)) {
                // WARNING
                console.log(quest)
                console.log(`${COLOR.fgRed}cant found ${fileName} in local & this version Aigis${COLOR.reset}`);
            }

            let localPath = raws.find(p => p.indexOf(`Location${location}.atb`) != -1);
            if (localPath) {
                let localRaw = rawToJson(localPath);

                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                // if (!mapLocationList[map][location]) { mapLocationList[map][location] = []; }
                mapLocationList[map][location] = localRaw;
            } else if (fs.existsSync(`${aigisLoaderPath}/MapLocationList.json`)) {
                // console.log(`${COLOR.fgRed}cant found Location${location} data${COLOR.reset}`)
                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                if (oldLocationList[map]) { mapLocationList[map][location] = oldLocationList[map][location]; }
            }

            let entryPath = raws.find(p => p.indexOf(`Entry${entry}.atb`) != -1);
            if (entryPath) {
                let entryRaw = rawToJson(entryPath);
                let entryLocation = [];
                for (let entry of entryRaw) {
                    if (!entry.EntryCommand ||
                        entry.EntryCommand.indexOf('CreateMapPlaceObject') == -1) continue;

                    let cmds = entry.EntryCommand.match(/CreateMapPlaceObject\(\s*\S+\s*,\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\);?/g);
                    for (let cmd of cmds) {
                        let [, plcName, ObjectID, X, Y] = cmd.match(/CreateMapPlaceObject\(\s*(\S+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\);?/);
                        entryLocation.push({ ObjectID, X, Y, _Command: 0 });
                    }
                }

                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                if (entryLocation.length > 0) mapLocationList[map][`Entry${entry}`] = entryLocation;

            } else if (entry && fs.existsSync(`${aigisLoaderPath}/MapLocationList.json`)
                && oldLocationList[map] && oldLocationList[map][`Entry${entry}`]) {
                // console.log(`${COLOR.fgRed}cant found Location${location} data${COLOR.reset}`)
                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                mapLocationList[map][`Entry${entry}`] = oldLocationList[map][`Entry${entry}`];
            }

            // debug
            // no new & old data
            if (!entryPath && !oldLocationList[map]) {
                console.log(`${COLOR.fgRed}cant found Map${map} Location${location} data${COLOR.reset}`)
                console.log('', quest);
            }
        }
    }

    // check map image usefull
    {
        let dataList = Object.keys(mapLocationList);
        let imgList = fs.readdirSync(mapsOutputPath);
        let md5List = [];
        // get md5
        for (let fname of imgList) {
            // get md5
            let id = fname.substring(3);
            let md5 = md5f(fs.readFileSync(`${mapsOutputPath}/${fname}`));
            md5List[id] = md5;
        }
        for (let fname of imgList) {
            let id = fname.substring(3);
            if (dataList.includes(id)) continue;
            // console.log(`${fname} location data is not exist`);

            let md5 = md5f(fs.readFileSync(`${mapsOutputPath}/${fname}`));
            let backup = [];
            md5List.forEach((_md5, _id) => { if (_md5 == md5 && _id.toString() != id) backup.push(_id); });
            if (backup.length == 0) continue;
            console.log(`${fname} location data is not exist, image same with Map${backup[0]} & other ${backup.length - 1} files`);

            fs.unlinkSync(`${mapsOutputPath}/${fname}`)
        }
        // console.log(md5List)
    }

    // map location data sort
    {
        // sort by key (MapNo)
        const sortMethod = (raw) => {
            let data = {};
            for (let key of Object.keys(raw).sort()) {
                data[`a${key}`] = sortMethod2(raw[key]);
            }
            return data;
        }
        // sort by key (LocationNo)
        const sortMethod2 = (raw) => {
            let data = {};
            let keys = Object.keys(raw).sort((a, b) => {
                let iA = parseInt(a);
                let iB = parseInt(b);
                return iA == iB ? 0 : (iA < iB ? -1 : 1);
            })
            for (let key of keys) {
                data[`a${key}`] = sortMethod3(raw[key]);
            }
            return data;
        }
        // sort by value
        const sortMethod3 = (raw) => {
            let data = raw ? raw.sort((a, b) => {
                let iA = a.ObjectID, iB = b.ObjectID;
                let jA = a.X, jB = b.X;
                let kA = a.Y, kB = b.Y;

                let r = iA == iB ? 0 : (iA < iB ? -1 : 1);
                if (r == 0) r = jA == jB ? 0 : (jA < jB ? -1 : 1);
                if (r == 0) r = kA == kB ? 0 : (kA < kB ? -1 : 1);

                return r;
            }) : raw;

            return data;
        }

        mapLocationList = sortMethod(mapLocationList);
    }



    let jsString = [];
    questList.sort((a, b) => { let iA = a.questID, iB = b.questID; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    questList.sort((a, b) => { let iA = a.missionTitle, iB = b.missionTitle; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    // questList.sort((a, b) => { let iA = a.location, iB = b.location; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    // questList.sort((a, b) => { let iA = a.map, iB = b.map; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    for (let q of questList) { jsString.push(`\t${JSON.stringify(q, null, '\t').replace(/\n/g, "")}`); }
    jsString = jsString.join(',\n');
    fs.writeFileSync(`${aigisLoaderPath}/QuestList.json`, `[\n${jsString}\n]`);
    fs.writeFileSync(`${scriptOutputPath}/rawQuestList.js`, `let questList = [\n${jsString}\n]`);



    missionList.sort((a, b) => { let iA = a.missionID, iB = b.missionID; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    missionList.sort((a, b) => { let iA = a.name, iB = b.name; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    jsString = JSON.stringify(missionList, null, '\t')
        .replace(/\n\t{3}/g, ` `)
        .replace(/\n\t{2}\]/g, ` ]`)
    fs.writeFileSync(`${aigisLoaderPath}/MissionList.json`, jsString);

    jsString = {};
    for (let m of missionList) { jsString[m.missionID] = m.name; }
    fs.writeFileSync(`${scriptOutputPath}/rawMissionList.js`, `let missionList = ${JSON.stringify(jsString, null, '\t')}`);



    jsString = JSON.stringify(mapLocationList, null, '\t')
        .replace(/\n\t\t\t\t/g, ` `)
        .replace(/\n\t\t\t\{/g, `{`)
        .replace(/\n\t\t\t\}/g, `}`)
        .replace(/\n\t\t\]/g, `]`)
        .replace(/\{\n\t\t"/g, `{\t"`)
        .replace(/\n\t\t"/g, `\n\t\t\t\t"`)
        .replace(/\n\t\}/g, `}`)
        .replace(/\"a/g, `"`)
        .replace(/InTheSea/ig, "InTheSea")
    fs.writeFileSync(`${aigisLoaderPath}/MapLocationList.json`, jsString);
    fs.writeFileSync(`${scriptOutputPath}/rawMapDataList.js`, `let mapDataList = ${jsString}`);


    console.log(`aigisQuestsList done...\n`);
}






const readRawData = () => {
    console.log(`readRawData start...`);
    resourceList = getFileList(resourcesPath);

    _GRs733a4 = xmlToJson(`${xmlPath}/GRs733a4.xml`)
    _QxZpjdfV = xmlToJson(`${xmlPath}/QxZpjdfV.xml`)

    let filepath;
    filepath = resourceList.find(p => p.includes("/NameText.atb") && p.includes("ALTB_gdtx.txt"));
    nameListRaw = rawToJson(filepath);

    filepath = resourceList.find(p => p.includes("/PlayerUnitTable.aar") && p.includes("ClassData.atb"));
    classListRaw = rawToJson(filepath);

    filepath = resourceList.find(p => p.includes("/AbilityList.atb"));
    abilityListRaw = rawToJson(filepath);
    filepath = resourceList.find(p => p.includes("/AbilityText.atb"));
    abilityTextRaw = rawToJson(filepath);

    filepath = resourceList.find(p => p.includes("/SkillList.atb"));
    skillListRaw = rawToJson(filepath);
    filepath = resourceList.find(p => p.includes("/SkillText.atb"));
    skillTextRaw = rawToJson(filepath);
    filepath = resourceList.find(p => p.includes("/SkillTypeList.atb"));
    skillTypeRaw = rawToJson(filepath);
    filepath = resourceList.find(p => p.includes("/SkillInfluenceConfig.atb"));
    skillInfluenceRaw = rawToJson(filepath);

    console.log(`readRawData done...\n`);
}

let resourceList;

let _GRs733a4;
let _QxZpjdfV;

let nameListRaw;
let classListRaw;
let abilityListRaw;
let abilityTextRaw;
let skillListRaw;
let skillTextRaw;
let skillTypeRaw;
let skillInfluenceRaw;

const main = async () => {

    if (!fs.existsSync(resourcesPath)) {
        console.log("!fs.existsSync(resources)");
        fs.mkdirSync(resourcesPath);
    }
    console.log(`resourcesPath: ${resourcesPath}\n`);

    // // download data
    await downloadRawData();
    readRawData();

    fs.writeFileSync(`${aigisLoaderPath}/raw/_GRs733a4.json`, JSON.stringify(_GRs733a4, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/_QxZpjdfV.json`, JSON.stringify(_QxZpjdfV, null, 2));

    // cards list
    await aigisCardsList();

    // quest list
    await aigisQuestsList();

    fs.writeFileSync(`${aigisLoaderPath}/raw/nameList.json`, JSON.stringify(nameListRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/classList.json`, JSON.stringify(classListRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/abilityList.json`, JSON.stringify(abilityListRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/abilityText.json`, JSON.stringify(abilityTextRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/skillList.json`, JSON.stringify(skillListRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/skillText.json`, JSON.stringify(skillTextRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/skillType.json`, JSON.stringify(skillTypeRaw, null, 2));
    fs.writeFileSync(`${aigisLoaderPath}/raw/skillInfluence.json`, JSON.stringify(skillInfluenceRaw, null, 2));
};
main();
