const fs = require("fs");
var Jimp = require('jimp');
const child_process = require('child_process');
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

const main = function () {
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

            Jimp.read(resources + "/" + filename)
                .then(img => {
                    return img.quality(60) // set JPEG quality
                        .write(filepath + ".jpg"); // save
                }).then(() => {
                    child_process.execSync(`cd ./html/maps/&ren ${md5}.jpg ${md5}`);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }

    console.log("output hashList.js")
    fs.writeFileSync("./html/hashList.js", "let hashList = " + JSON.stringify(hashList));

}; main();
