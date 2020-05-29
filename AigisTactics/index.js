const fs = require("fs");
const path = require("path");
const exec = require('child_process').exec;
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

    // raw data path
    let filesTxt = resources + "/files.txt";
    let missionTxt = resources + "/missions.txt";

    // waiting mission.txt
    while (true) {
        console.log("waiting raw files... ", missionTxt);
        if (fs.existsSync(missionTxt)) { break; }
        await sleep(1000);
    }

    // get mission data
    let missionData = rawToJson(missionTxt);
    missionData.sort((a, b) => { return a.id.toString().localeCompare(b.id.toString()); });

    // get map data
    // read filelist & get map img/data
    let filelist = fs.readFileSync(filesTxt).toString().trim().split("\n");
    let batTxt = ["@ECHO off",
        "cd ../AigisTools",
        "SET PATH=%~dp0Utilities\\Lua 5.3;%~dp0Utilities\\cURL\\bin;%~dp0Utilities\\GraphicsMagick;%PATH%",
        "SET LUA_PATH=%~dp0Scripts\\?.lua",
        "SET LUA_PATH_5_3=%~dp0Scripts\\?.lua\n"];
    // loop all mission data
    for (let i in missionData) {
        let mission = missionData[i];
        // filter
        let result = filelist.filter((file) => { return file.indexOf("Map" + mission.map) != -1 })
        if (result.length <= 0) {
            console.log("can't found <Map" + mission.map + ">");
        } else {
            for (let j in result) {
                // get filename
                let filename = result[j].substr(89);

                // check file exist?
                if (fs.existsSync(resources + "/" + filename)) { continue; } // skip exist

                // add to batlist
                let cmdString = "lua Scripts\\get_file.lua " + filename;
                if (batTxt.indexOf(cmdString) == -1) batTxt.push(cmdString);
            }
        }
    }
    batTxt.push("\ndel get_maps.bat");
    fs.writeFileSync("../AigisTools/get_maps.bat", batTxt.join("\r\n"));
    exec('cd ../AigisTools/&start get_maps.bat');
    console.log("cmd get_maps.bat", batTxt.length);

    // waiting get_maps.bat done
    while (true) {
        console.log("waiting get_maps.bat done... ", "../AigisTools/get_maps.bat");
        if (!fs.existsSync("../AigisTools/get_maps.bat")) { break; }
        await sleep(1000);
    }

    // copy map data
    // get MapPng|Location txt list
    let resourceList = getFileList(resources);
    // get exist resource files list
    let pngList = [];
    for (let i in missionData) {
        let mission = missionData[i];
        let filename = "Map" + mission.map;
        let _location = "Location" + mission.location.toString().padStart(2, "0");

        // get resource files list
        let mapPng = resourceList.find((file) => { return (file.indexOf(filename) != -1 && /\.png$/i.test(file)); });
        let mapPngTxt = resourceList.find((file) => { return (file.indexOf(filename) != -1 && /MapPng[\S]+\.txt$/i.test(file)); });
        let locationTxt = resourceList.find((file) => { return (file.indexOf(filename) != -1 && file.indexOf(_location) != -1 && /Location[\S]+\.txt$/i.test(file)); });

        // check data
        if (!mapPng || !mapPngTxt || !locationTxt) {
            console.log(mission.id, mission.name, "data missing!");
            console.log("map id: ", mission.map);
            console.log(mapPng);
            console.log(mapPngTxt);
            console.log(locationTxt);
            console.log("");
            continue;
        }

        // // MapPng.atx
        // console.log(fs.readFileSync(mapPngTxt).toString().replace(/[\s\n\r]+/g, " "));

        // Location.atb
        let locations = fs.readFileSync(locationTxt).toString().replace(/ [ ]+/g, " ").split("\n");
        for (let j in locations) {
            let locals = locations[j].trim().split(" ");
            if (!/\d/.test(locals[0])) { continue; }
            let obj = { ObjectID: locals[0], X: locals[1], Y: locals[2], _Command: locals[3] };
            missionData[i].locationList.push(obj);
        }
    }

    // output mission data
    fs.writeFileSync("./missionData.json", JSON.stringify(missionData, null, 4));
    console.log("missionData.json", missionData.length);


};
main().catch(console.log);



