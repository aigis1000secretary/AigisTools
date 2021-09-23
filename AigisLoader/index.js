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
const aigisToolPath = `../AigisTools`;
const xmlPath = `${aigisToolPath}/out`;
const resourcesPath = `${xmlPath}/files`;
const rawListPath = `${xmlPath}/filelists/Desktop R Files.txt`;
const changesListPath = `${xmlPath}/Desktop R Changes.txt`;

// outputPath
const iconsOutputPath = `../html/icons`;
const mapsOutputPath = `../html/maps`;
const scriptOutputPath = `../html/script`;

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
        if (true) {
            let filelist = fs.readFileSync(rawListPath).toString().split("\n");
            let listReg = /\S{40},\S{32},\S,\S{12},(\S+)/;

            for (let line of filelist) {
                if (!listReg.test(line)) { continue; }  // not match regex
                let match = line.match(listReg);
                rawList.push(match[1]);
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
        // cards data
        if (/PlayerUnitTable\.aar/i.test(filename)) { return dlRaw; }
        if (/NameText\.atb/i.test(filename)) { return dlRaw; }
        if (/Ability(List|Text)\.atb/i.test(filename)) { return dlRaw; }
        if (/Skill(List|Text|TypeList|InfluenceConfig)\.atb/i.test(filename)) { return dlRaw; }

        //
        if (/QuestNameText\d*\.atb/i.test(filename)) { return dlImg; }
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

    let getSkillData = function (card, skillID) {
        let skillData = { name: [], text: [], nextSkill: 0 };
        if (skillID == 0) { return skillData; }

        let skillIDList = [];

        while (true) {
            // get skill obj
            let skill = skillListRaw[skillID] || { ID_Text: 0 };
            let text = skillTextRaw[skill.ID_Text];
            if (!skill || !text) return { name: [skill ? skill.SkillName : `SkillID_${skillID}`], text: [text ? text.Data_Text : `Data_Text_${skill.ID_Text}`], nextSkill: 0 };
            text = text.Data_Text.replace(/[\s]+\n[\s]+/g, "\n");
            // "Data_Text": "出撃している全員の\n攻撃力と防御力が\n<HERO_POW>％上昇\n出撃中は常に発動"

            // get skill base data
            let name = skill.SkillName;
            text = text.replace("(現在[NUM_TARGET]体)", "");
            text = text.replace("[NUM_TARGET]", "X");
            text = text.replace(/\[/g, "<").replace(/\]/g, ">");
            text = text.replace("<TIME>", skill.ContTimeMax);
            text = text.replace(/コストｰ/g, "コスト-");
            let nextSkill = 0;
            let POW = skill.PowerMax;

            // get skill influence
            let type = skillTypeRaw.find(ele => ele.SkillTypeID == skill.SkillType);
            let infl = [];
            for (let i = skillInfluenceRaw.findIndex(ele => ele.Data_ID == type.ID_Influence); i < skillInfluenceRaw.length; ++i) {
                let infl0 = skillInfluenceRaw[i];
                if (infl0.Data_ID != 0 && infl0.Data_ID != type.ID_Influence) { break; }
                infl.push(infl0);
            }

            if (skillID == 1659) {
                // for  eval(iExpression);
                var HasAbiInf = () => { return false; };
            }

            infl = infl.filter(ele => {
                let iExpression = ele._ExpressionActivate;
                if (skillID == 1346 && ele.Data_InfluenceType == 83) { return false; }
                if (skillID == 663 && ![2, 89].includes(ele.Data_InfluenceType)) { return false; }
                if (ele.Data_InfluenceType == 6 && [326, 673, 1307, 1456, 1457].includes(skillID)) { return false; }
                if ([1027, 1028, 1029].includes(skillID) && ele.Data_InfluenceType == 2) { return false; }
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

            // // debug msg
            // if (name.includes("閃いた")) {
            //     console.log(`${name}\t text:\n${text}`);
            // }

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

                if (iType == 6 && card.InitClassID == 12500) { desc = Math.round(desc / 0.115) / 10; }

                // // debug msg
                // if (name.includes("閃いた")) {
                //     console.log(`${name}\t iType: ${iType}\t desc001: ${desc}`);
                // }
                // if (skillID == 617) {
                //     console.log(`${name}\t iType: ${iType}\t desc: ${desc}`);
                // }

                // iType == 187 即死
                let desc100 = Math.round(desc * 100);
                if (iType == 2) { text = text.replace(/<ATK>|<POW_R>|<PATK>/, desc); }         // ATK
                if (iType == 3) { text = text.replace(/<ATK>|<POW_I>/, desc100); }   // ALL ATK
                if (iType == 4) { text = text.replace(/<DEF>|<POW_R>/, desc); }         // DEF
                if (iType == 5) { text = text.replace(/<DEF>|<POW_I>/, desc100); }   // ALL DEF
                if (iType == 6) { text = text.includes("<RNG>") ? text.replace(/<RNG>/, desc) : text = text.replace(/<POW_R>/, desc) }	// RNG
                if (iType == 7) { text = text.replace(/<NUM_SHOT>/, desc); }
                if (iType == 8) { text = text.replace(/<AREA>|<POW_R>/, desc); }
                if (iType == 9) { text = text.replace(/<AVOID>|<POW_I>/, desc100); }
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
                if (iType == 200) { text = text.replace(/<RNG>/, desc); }

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
            // if (skillListRaw[nextSkill].SkillName == skillListRaw[card.ClassLV1SkillID].SkillName) { break; }
            skillID = nextSkill;
        }

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
        let _class = classListRaw.find(e => e.ClassID == card.InitClassID);
        if (!_class) { console.error(`${COLOR.fgRed}Cant found ClassID == ${card.InitClassID}${COLOR.reset}`) }

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
            // 2: 帝國, 3-4: 遠國, 5: 砂漠, 6-7: 異鄉, 8: 東國
            let genus = card.Genus;
            // 101: 新春, 102: 情人, 103: 學園, 104: 花嫁, 105: 夏季, 106: 萬聖, 107: 聖夜, 108: Q, 109: 溫泉

            let year = 0
            let isEvent = (card._TradePoint <= 15) ? 1 : 0; // _TradePoint
            let isToken = (card.SellPrice == 0 || nameListRaw[i].Message.includes("ダミー")) ? 1 : 0;

            // Collaboration data format
            switch (id) {
                // ランス10-決戦-
                case 581: { assign = -1; } break;

                // 真・恋姫†夢想-革命
                case 648: case 649: case 650: case 651: case 652:   // 2018/07
                case 848: case 849: case 850: case 851: case 852:   // 2019/08
                    { assign = -2; } break;

                //  封緘のグラセスタ
                case 719:
                case 720: { assign = -3; } break;

                //  ガールズ・ブック・メイカー（GBM）
                case 815: case 816: case 817: case 818: case 819:   // 2019/06
                case 1015: case 1016: case 1017: case 1018: // 2020/06
                    { assign = -4; } break;

                //  流星ワールドアクター
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
            }

            // set year
            if (id > 1125) year = 2021;
            else if (id > 942) year = 2020;
            else if (id > 726) year = 2019;
            else if (id > 572) year = 2018;
            else if (id > 437) year = 2017;
            else if (id > 323) year = 2016;
            else if (id > 201) year = 2015;
            else if (id > 85) year = 2014;
            else year = 2013;

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

        // // CharaDatabase.json
        {
            // data
            let kind = card.Kind;
            // 0: 男性, 1: 女性, 2: 無性(?), 3: 換金, 2: 經驗
            let isToken = (card.SellPrice == 0 || nameListRaw[i].Message.includes("ダミー")) ? 1 : 0;


            // db data
            let name = nameListRaw[i].Message;
            let subName = nameListRaw[i].RealName;
            if (i == 0) {
                name = "王子【通常】";
                subName = "王子";
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
                _class = classListRaw.find(e => e.Name == className.replace("ちび", ""));
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
            if (name == "刻聖霊ボンボリ" && i != 289) continue;

            let obj = {
                name,
                subName,
                ability, ability_aw,
                skill, skill_aw,
                urlName,
                rarity,
                class: className
            }

            charaDatabase.push(obj);
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
    fs.writeFileSync("CharaDatabase.json", JSON.stringify(charaDatabase, '\t', 1));
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

        let missionCfgPath = [];
        missionCfgPath = resourceList.filter(p => p.includes("MissionConfig") && !p.startsWith("Emc"));

        for (let filepath of missionCfgPath) {
            let missionCfgArray = rawToJson(filepath);

            for (let missionCfg of missionCfgArray) {

                let _name = missionCfg.Name || "NULL";
                let missionID = missionCfg.MissionID;

                let questID = missionCfg.QuestID || false;
                questID = questID ? questID.split(',') : [];
                for (let i in questID) { questID[i] = parseInt(questID[i]); }

                // fill mission title
                let titleID = missionCfg.TitleID;
                if (titleID != undefined && _name == "NULL") { _name = missionNameText[titleID].Data_Text }
                if (missionID < 110000) {
                    _name = [
                        "第一章　王都脱出", "第二章　王城奪還", "第三章　熱砂の砂漠", "第四章　東の国", "第五章　魔法都市",
                        "第六章　密林の戦い", "第七章　魔の都", "第八章　魔神の体内", "第九章　鋼の都", "第十章　海底"
                    ][missionID - 100001];
                }


                // search mission in db
                let mission = missionList.find(q => q.missionID == missionID)
                // buind new mission
                if (!mission) {
                    mission = { name: _name, missionID, questID, titleID };
                    missionList.push(mission);
                } else {
                    mission.questID.concat(questID);
                }
            }
        }
    }; console.log(`get MissionConfig data`);

    // *MissionQuestList.atb
    // read raw mission quest list
    // fill mission.QuestID
    {
        let missionQListPath = [];
        missionQListPath = resourceList.filter(p => p.includes("MissionQuestList"));

        for (let filepath of missionQListPath) {
            let missionQListArray = rawToJson(filepath);

            for (let missionQList of missionQListArray) {

                let missionID = missionQList.MissionID;
                let questID = missionQList.QuestID;

                // search mission in db
                let mission = missionList.find(q => q.missionID == missionID)
                if (mission) {
                    mission.questID.push(questID);
                } else {
                    // let listName = path.parse(filepath).dir;
                    // console.log(`${listName}`);
                    // console.log(`${COLOR.fgRed}cant found missionID = ${missionID}${COLOR.reset}`);
                }
            }
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
            let mission = missionList.find(m => m.questID.indexOf(questID) != -1);
            let missionID = missionTitle = "NULL";
            if (mission) {
                missionID = mission.missionID;
                missionTitle = mission.name;

                if (missionID == 110001) {
                    map = `110001_${map}`;
                }
            }
            // get quest name text
            let questName = "NULL";
            if (missionID != "NULL") {
                let filepath = resourceList.find(p => p.includes(`QuestNameText${missionID}.atb`));
                let questNameText = rawToJson(filepath);

                let questNameID = questRaw.QuestTitle;
                questName = questNameText[questNameID].Message;
            }

            // buind new quest
            if (missionID != "NULL") {
                quest = {
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

    // get old quest list
    if (fs.existsSync(`QuestList.json`)) {
        let oldQuest = fs.readFileSync(`QuestList.json`).toString();
        oldQuest = oldQuest.substring(oldQuest.indexOf('['));
        oldQuest = eval(oldQuest);
        for (let quest of oldQuest) {
            let q = (questList.find(q => q.questID == quest.questID));
            if (!q) {
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
        if (fs.existsSync(`MapLocationList.json`)) {
            oldLocationList = fs.readFileSync(`MapLocationList.json`).toString();
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
            if (pngPath && (!fs.existsSync(outputPath) || changesList.indexOf(mapName) != -1)) {
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
                console.log(`${COLOR.fgRed}cant found ${fileName} in local & this version Aigis${COLOR.reset}`);
            }

            let localPath = raws.find(p => p.indexOf(`Location${location}.atb`) != -1);
            if (localPath) {
                let localRaw = rawToJson(localPath);

                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                // if (!mapLocationList[map][location]) { mapLocationList[map][location] = []; }
                mapLocationList[map][location] = localRaw;
            } else if (fs.existsSync(`MapLocationList.json`)) {
                // console.log(`${COLOR.fgRed}cant found Location${location} data${COLOR.reset}`)
                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                mapLocationList[map][location] = oldLocationList[map][location];
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

            } else if (entry && fs.existsSync(`MapLocationList.json`)) {
                // console.log(`${COLOR.fgRed}cant found Location${location} data${COLOR.reset}`)
                if (!mapLocationList[map]) { mapLocationList[map] = {}; }
                mapLocationList[map][`Entry${entry}`] = oldLocationList[map][`Entry${entry}`];
            }
        }
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
            let data = raw.sort((a, b) => {
                let iA = a.ObjectID, iB = b.ObjectID;
                let jA = a.X, jB = b.X;
                let kA = a.Y, kB = b.Y;

                let r = iA == iB ? 0 : (iA < iB ? -1 : 1);
                if (r == 0) r = jA == jB ? 0 : (jA < jB ? -1 : 1);
                if (r == 0) r = kA == kB ? 0 : (kA < kB ? -1 : 1);

                return r;
            });

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
    fs.writeFileSync(`QuestList.json`, `[\n${jsString}\n]`);
    fs.writeFileSync(`${scriptOutputPath}/rawQuestList.js`, `let questList = [\n${jsString}\n]`);



    missionList.sort((a, b) => { let iA = a.missionID, iB = b.missionID; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    missionList.sort((a, b) => { let iA = a.name, iB = b.name; return iA == iB ? 0 : (iA < iB ? -1 : 1); });
    jsString = JSON.stringify(missionList, null, '\t')
        .replace(/\n\t{3}/g, ` `)
        .replace(/\n\t{2}\]/g, ` ]`)
    fs.writeFileSync(`MissionList.json`, jsString);

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
    fs.writeFileSync(`MapLocationList.json`, jsString);
    fs.writeFileSync(`${scriptOutputPath}/rawMapDataList.js`, `let mapDataList = ${jsString}`);


    console.log(`aigisQuestsList done...\n`);
}






const readRawData = () => {
    console.log(`readRawData start...`);
    resourceList = getFileList(resourcesPath);

    _GRs733a4 = xmlToJson(`${xmlPath}/GRs733a4.xml`)
    _QxZpjdfV = xmlToJson(`${xmlPath}/QxZpjdfV.xml`)

    let filepath
    filepath = resourceList.find(p => p.includes("NameText.atb") && p.includes("ALTB_gdtx.txt"));
    nameListRaw = rawToJson(filepath)

    filepath = resourceList.find(p => p.includes("ClassData.atb"));
    classListRaw = rawToJson(filepath)

    filepath = resourceList.find(p => p.includes("AbilityList.atb"));
    abilityListRaw = rawToJson(filepath)
    filepath = resourceList.find(p => p.includes("AbilityText.atb"));
    abilityTextRaw = rawToJson(filepath)

    filepath = resourceList.find(p => p.includes("SkillList.atb"));
    skillListRaw = rawToJson(filepath)
    filepath = resourceList.find(p => p.includes("SkillText.atb"));
    skillTextRaw = rawToJson(filepath)
    filepath = resourceList.find(p => p.includes("SkillTypeList.atb"));
    skillTypeRaw = rawToJson(filepath)
    filepath = resourceList.find(p => p.includes("SkillInfluenceConfig.atb"));
    skillInfluenceRaw = rawToJson(filepath)

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

    // cards list
    await aigisCardsList();

    // quest list
    await aigisQuestsList();

    fs.writeFileSync(`raw/_GRs733a4.json`, JSON.stringify(_GRs733a4, null, 2));
    fs.writeFileSync(`raw/_QxZpjdfV.json`, JSON.stringify(_QxZpjdfV, null, 2));
    fs.writeFileSync(`raw/nameList.json`, JSON.stringify(nameListRaw, null, 2));
    fs.writeFileSync(`raw/classList.json`, JSON.stringify(classListRaw, null, 2));
    fs.writeFileSync(`raw/abilityList.json`, JSON.stringify(abilityListRaw, null, 2));
    fs.writeFileSync(`raw/abilityText.json`, JSON.stringify(abilityTextRaw, null, 2));
    fs.writeFileSync(`raw/skillList.json`, JSON.stringify(skillListRaw, null, 2));
    fs.writeFileSync(`raw/skillText.json`, JSON.stringify(skillTextRaw, null, 2));
    fs.writeFileSync(`raw/skillType.json`, JSON.stringify(skillTypeRaw, null, 2));
    fs.writeFileSync(`raw/skillInfluence.json`, JSON.stringify(skillInfluenceRaw, null, 2));
};
main();
