
const fs = require("fs");
const path = require("path");
const child_process = require('child_process');

// vars
const aigisToolPath = `../AigisTools`;
const xmlPath = `${aigisToolPath}/out`;

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

String.prototype.replaceAll = function (s1, s2) {
    var source = this;
    while ((temp = source.replace(s1, s2)) != source) {
        source = temp;
    }
    return source.toString();
}

let _atob = function (base32Str) {
    let base2Str = "";
    while (base32Str.length > 0) {
        let temp = base32Str.substr(0, 1);
        base32Str = base32Str.substr(1);
        base2Str += parseInt(temp, 32).toString(2).padStart(5, "0");
    }
    return base2Str;
}
let _btoa = function (base2Str) {
    let base32Str = "";
    while (base2Str.length > 0) {
        if (base2Str.length < 5) { base2Str = base2Str.padEnd(5, "0"); }
        let temp = base2Str.substr(0, 5);
        base2Str = base2Str.substr(5);
        base32Str += parseInt(temp, 2).toString(32);
    }
    return base32Str;
}


const main = async () => {

    console.log(`do xml oS5aZ5ll`);
    child_process.execSync(`do xml oS5aZ5ll raw`, { cwd: aigisToolPath }).toString().trim();

    let _oS5aZ5ll = xmlToJson(`${xmlPath}/oS5aZ5ll.xml`)
    let _json = JSON.parse(
        JSON.stringify(_oS5aZ5ll, null, 2)
            .replaceAll(`"A1"`, `"CardID"`)
            .replaceAll(`"A2"`, `"ClassID"`)
            .replaceAll(`"A4"`, `"EXP"`)
    );

    // get card list str
    let cardList = []
    for (let card of _json) {
        cardList[card.CardID] = 1;
    }
    for (let i = 0; i < cardList.length; ++i) {
        if (!cardList[i]) { cardList[i] = 0; }
    }

    let urlCode = _btoa(cardList.join(''));
    let url = `https://aigis1000secretary.github.io/AigisTools/html/AigisChecker.html?sortBy=date&data=${urlCode}`;
    require('child_process').exec('clip').stdin.end(url);
    console.log('Copy to clipboard...done')

    fs.writeFileSync(`raw/_oS5aZ5ll.json`, JSON.stringify(_json, null, 2));
};
main();
