const fs = require("fs");
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

    let hashList = {};
    let count = 0;
    for (let i in resourceList) {
        let filename = resourceList[i]
        console.log("[", i, "/", resourceList.length, "] getting", filename, "md5...")

        // save hash list
        let png = fs.readFileSync(resources + "/" + filename);
        let md5 = md5f(png.toString());
        hashList[filename] = md5;

        let filepath = "./html/maps/" + md5;
        if (!fs.existsSync(filepath)) {
            // fs.writeFileSync(filepath, png);

            await new Promise(function (resolve, reject) {
                Jimp.read(resources + "/" + filename)
                    .then(img => {
                        return img.quality(70) // set JPEG quality
                            .write(filepath + ".jpg"); // save
                    }).then(async () => {
                        console.log("Jimp.quality(70).write()");
                        await sleep(100);
                        let log = child_process.execSync(`cd ./html/maps/&ren ${md5}.jpg ${md5}`).toString().trim();
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
    }

    console.log("output hashList.js")
    fs.writeFileSync("./html/hashList.js", "let hashList = " + JSON.stringify(hashList));

}; main();
