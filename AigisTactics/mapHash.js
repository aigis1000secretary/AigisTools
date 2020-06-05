const fs = require("fs");
const path = require("path");
const Jimp = require('jimp');
const child_process = require('child_process');
global.sleep = async function (ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }
const md5f = function (str) { return require('crypto').createHash('md5').update(str).digest('hex'); }

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
    let resources = "../AigisTools/out/files";
    if (!fs.existsSync(resources)) { console.log("!fs.existsSync(resources)"); return; }

    let resourceList = fs.readdirSync(resources);
    resourceList = resourceList.filter((file) => { return (/^Map[\d_]+\.png$/i.test(file)); });
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

    // map jpg
    let mapHashList = {};
    let count = 0;
    for (let i in resourceList) {
        let resource = resourceList[i];
        console.log("[", i, "/", resourceList.length, "] getting", resource, "md5...")

        let sourcePath = resources + "/" + resource;
        let filename = path.win32.basename(sourcePath);
        let pngBinary = fs.readFileSync(sourcePath);
        let md5 = md5f(pngBinary.toString());
        mapHashList[filename] = md5;
        
        if (/map/i.text(resource)) {
            let outputDir = "../html/maps/";
            let outputPath = outputDir + md5;

            if (!fs.existsSync(outputPath)) {
                // fs.writeFileSync(filepath, png);
                await new Promise(function (resolve, reject) {
                    Jimp.read(sourcePath)
                        .then(img => {
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
                            console.error(err);
                            reject();
                        });
                });
            }
        } else {
            let outputDir = "../html/weather/";
            let outputPath = outputDir + md5;

            fs.createReadStream(sourcePath).pipe(fs.createWriteStream(outputPath));
        }
    }

    console.log("output mapHashList.js")
    fs.writeFileSync("../html/script/mapHashList.js", "let mapHashList = " + JSON.stringify(mapHashList, null, "\t"));

}; main();
