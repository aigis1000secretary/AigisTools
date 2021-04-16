
const fs = require('fs');
const Jimp = require('jimp');
const child_process = require('child_process');

let cachepath = "./AigisTools/Data/Cache/net/";

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

const main = async () => {
    let cacheList = getFileList(cachepath);

    // console.table(cacheList);

    for (let filepath of cacheList) {

        let [, part1, part2] = filepath.match(/([0-9a-f]{40})\/([0-9a-z]{32})(.png)?/i);

        if (fs.existsSync(`${cachepath}${part1}/${part2}`)) {
            child_process.execSync(`rename ${cachepath}${part1}/${part2} ${part2}.png`.replace(/\//g, "\\")).toString().trim();

            await new Promise(function (resolve, reject) {
                Jimp.read(`${filepath}.png`)
                    .then(img => {
                        let w = img.bitmap.width; //  width of the image
                        let h = img.bitmap.height; // height of the image
                        console.log(filepath);
                        // console.log(w, h);
                        child_process.execSync(`copy ${cachepath}${part1}/${part2}.png ./${part2}.png`.replace(/\//g, "\\")).toString().trim();
                        resolve();
                    })
                    .catch((e) => {
                        // console.log(filepath);
                        // console.log(cacheList.indexOf(filepath), cacheList.length, e);
                        resolve();
                    })
            });

            child_process.execSync(`rename ${cachepath}${part1}/${part2}.png ${part2}`.replace(/\//g, "\\")).toString().trim();
        }



    }
}
main();