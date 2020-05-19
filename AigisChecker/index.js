const fs = require("fs");
const path = require("path");

// get local file list
let getFileList = function(dirPath) {
    let result = [];
    let apiResult = fs.readdirSync(dirPath);
    for (let i in apiResult) {
        if (fs.lstatSync(dirPath + "/" + apiResult[i]).isDirectory()) {
            result = result.concat(getFileList(dirPath + "/" + apiResult[i]));
        } else if (path.extname(dirPath + "/" + apiResult[i]) == ".png" && apiResult[i] != "altx.png") {
            result.push(dirPath + "/" + apiResult[i]);
        }
    }
    return result;
};
let rawDataToCsv = function(rawPath, csvPath) {
    let raw = fs.readFileSync(rawPath).toString();
    let row0;

    // trim
    raw = raw.replace(/[\s]*\n[\s]*/g, "\n");

    // space in string
    raw = raw.replace(/　/g, " ");
    raw = raw.replace(/\"\"/g, "@");
    let reg = /\"[^\"\n]+\"/;
    while (reg.test(raw)) {
        row0 = reg.exec(raw)[0];
        let newRow = row0;
        newRow = newRow.replace(/\"/g, "").trim();
        newRow = newRow.replace(/ /g, "@");
        raw = raw.replace(row0, newRow);
    }
    reg = /[^A-Za-z0-9\- ] +[^A-Za-z0-9\- ]/;
    while (reg.test(raw)) {
        row0 = reg.exec(raw)[0];
        let newRow = row0;
        newRow = newRow.replace(/ /g, "@");
        raw = raw.replace(row0, newRow);
    }

    // space
    raw = raw.replace(/ +/g, ",");
    raw = raw.replace(/@/g, " ");
    // empty srting ("")
    raw = raw.replace(/, ,/g, ",,");
    // trim 
    raw = raw.trim();

    // write to file
    fs.writeFileSync(csvPath, raw);
    console.log("fs.writeFileSync(", csvPath, ")");

    // return data
    let result = [];
    let rows = raw.split("\n");
    for (let i in rows) {
        result.push(rows[i].split(","));
    }
    return result;
};
let encodeBase64 = function(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString('base64');
}

const main = function() {
    // check resources
    let resources = "./Resources";
    if (!fs.existsSync(resources)) { consoe.log("!fs.existsSync(resources)"); return; }

    // raw data path
    let cardsTxt = "./Resources/cards.txt";
    let classTxt = "./Resources/PlayerUnitTable.aar/002_ClassData.atb/ALTB_cldt.txt";

    // set data list index
    let temp = [];
    temp = rawDataToCsv(cardsTxt, "cards.csv");
    let cardsData = [];
    for (let i in temp) {
        let id = parseInt(temp[i][1]);
        if (!isNaN(id)) {
            cardsData[id] = temp[i];
        }
    }
    temp = rawDataToCsv(classTxt, "class.csv");
    let classData = [];
    for (let i in temp) {
        let id = parseInt(temp[i][0]);
        if (!isNaN(id)) {
            classData[id] = temp[i];
        }
    }

    // console.table(cardsData)
    // console.table(classData)

    // result
    let resultJson = [];

    // get png list
    let icons = getFileList(resources + "/ico_00.aar");

    // console.table(icons);
    let id;
    for (let i in icons) {
        // var
        let iconPath = icons[i];
        id = parseInt(path.basename(iconPath).replace("_001.png", ""));

        // set json data
        if (!cardsData[id]) continue;
        let name = cardsData[id][0];
        let rare = parseInt(cardsData[id][7]);
        let classId = parseInt(cardsData[id][2]);
        let sortGroupID = classData[classId] ? parseInt(classData[classId][39]) : 0;
        let placeType = classData[classId] ? parseInt(classData[classId][41]) : 0;
        let kind = parseInt(cardsData[id][6]);
        let isEvent = (parseInt(cardsData[id][48]) <= 15) ? 1 : 0; // _TradePoint
        let assign = parseInt(cardsData[id][60]);
        let genus = parseInt(cardsData[id][61]);
        // let identity = parseInt(cardsData[id][62]);

        // Hero rare data format
        switch (rare) {
            case 11:
                rare = 5.1;
                break;
            case 10:
                rare = 4.1;
                break;
            case 7:
                rare = 3.5;
                break;
        }

        // Collaboration data format
        switch (id) {

            case 581: // ランス10-決戦-
                assign = -1;
                break;
            case 648: // 真・恋姫†夢想-革命
            case 649:
            case 650:
            case 651:
            case 652:
            case 848:
            case 849:
            case 850:
            case 851:
            case 852:
                assign = -2;
                break;
            case 719: //  封緘のグラセスタ
            case 720:
                assign = -3;
                break;
            case 815: //  ガールズ・ブック・メイカー（GBM）
            case 816:
            case 817:
            case 818:
                assign = -4;
                break;
            case 955: //  流星ワールドアクター
            case 956:
                assign = -5;
                break;

            case 497:
                name += "（遠国の近衛兵）";
                break;
            case 498:
                name += "（遠国の前衛戦術家）";
                break;
            case 499:
                name += "（遠国の弓兵）";
                break;
            case 501:
                name += "（遠国の公子）";
                break;

            case 684:
                name += "（異郷の槌使い）";
                break;
            case 685:
                name += "（異郷の盗賊）";
                break;
            case 687:
                name += "（異郷の騎士）";
                break;
            case 688:
                name += "（異郷の妖精）";
                break;
        }
        if (name.indexOf("王子") != -1) {
            rare = 5.2;
        }

        // skip who not a unit
        let skipList = [1];
        if (skipList.indexOf(id) != -1) continue;
        // skip token
        let sellPrice = parseInt(cardsData[id][11]);
        if (sellPrice == 0) continue;
        // skip low rare
        if (rare <= 1) continue;
        // skip seirei
        if (sortGroupID == 10) continue;
        // skip Non-R18 Collaboration
        if (assign == 4 || assign == 7) continue;

        let obj = {
            id,
            name,
            rare,
            classId,
            sortGroupID,
            placeType,
            kind,
            isEvent,
            assign,
            genus, // identity,
            img: "data:image/png;base64," + encodeBase64(iconPath),
        };
        // resultJson.push(obj);
        resultJson[id] = obj;
    }

    // write to file
    let cardsJs = ["var maxCid = " + (id + 1) + ";\nvar charaData = ["];
    for (let i in resultJson) {
        cardsJs.push("\t" + JSON.stringify(resultJson[i], null, 1).replace(/\s*\n\s*/g, "\t") + ",");
    }
    cardsJs.push("]");

    fs.writeFileSync("./html/cards.js", cardsJs.join("\n"));
    console.log("fs.writeFileSync( cards.js )");

};
main();