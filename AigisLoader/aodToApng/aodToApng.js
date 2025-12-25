// TODO:
// weather png

// require
const fs = require("fs");
const path = require("path");
const child_process = require('child_process');
const Jimp = require('jimp');

// switch
const dlRaw = process.env.NODE_DLRAW == "false" ? false : true;
const dlImg = process.env.NODE_DLIMG == "false" ? false : true;

// vars
const aigisToolPath = `../AigisTools`;
const xmlPath = `${aigisToolPath}/out`;
const resourcesPath = `${xmlPath}/files`;
const rawListPath = `${xmlPath}/filelists/Desktop A Files.txt`;
const addedListPath = `${xmlPath}/Desktop A Added.txt`;
const changesListPath = `${xmlPath}/Desktop A Changes.txt`;

// outputPath
const iconsOutputPath = `../html/icons`;
const mapsOutputPath = `../html/maps`;
const scriptOutputPath = `../html/script/`;

// method
global.sleep = async function (ms) { return new Promise((resolve) => { setTimeout(resolve, ms); }); }

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

let resourceList;

const aodToApng = async (basepath) => {
    console.log(basepath)

    let resource = getFileList(basepath);
    // read anime data
    let [, tName, aName] = basepath.match(/([^\/]+)\.aar\/([^\/]+)\.aod/);
    let filename = `${tName}_${aName}.png`;


    // get frame parameter
    let pngArray = [];
    let centerX = 0, centerY = 0, width = 0, height = 0;
    // get binary
    for (let pngPath of resource) {
        if (!/png$/.test(pngPath)) { continue; }

        let rawPng = await new Promise((resolve, reject) => {
            Jimp.read(pngPath).then(resolve).catch(reject);
        });

        let txtPath = pngPath.replace(/png$/, "txt");
        let tmp = fs.readFileSync(txtPath).toString();
        [, x, y] = tmp.match(/origin_x:(\d+)\s+origin_y:(\d+)/);
        if (x > 65500) x = 65536 - x;
        if (y > 65500) y = 65536 - y;

        centerX = Math.max(centerX, x);
        centerY = Math.max(centerY, y);
        width = Math.max(width, rawPng.bitmap.width - x);
        height = Math.max(height, rawPng.bitmap.height - y);

        let pngName = path.parse(pngPath).name;
        pngArray.push({ rawPng, x, y, pngName, pngPath });
    }
    // console.table(pngArray)
    if (pngArray.length <= 0) { return; }
    else if (pngArray.length == 1) {
        fs.copyFileSync(pngArray[0].pngPath, `./out/${filename}`);
        // fs.writeFileSync(`./out/${filename}`, fs.readFileSync(pngArray[0].pngPath, 'binary'), 'binary');
        return;
    }
    // console.log(centerX, centerY, width, height)


    // get anime parameter
    let almt = `${basepath}/ALMT.txt`;
    let tmp = fs.readFileSync(almt).toString();
    let [, pngLength] = tmp.match(/length: (\d+)/); // anime length
    // get pattern array
    let patternNo = [];
    for (let line of tmp.split('\n')) {
        if (!/\d+\s@\d+:\s\d+/.test(line)) { continue; }

        let [, pngID, frame] = line.match(/(\d+)\s@(\d+):\s\d+/);
        patternNo.push({ pngID: parseInt(pngID), frame: parseInt(frame) });
    }
    // console.table(patternNo)


    // set frame list pre 1fps
    let frameArray = [];
    for (let i = 0; i <= parseInt(pngLength); ++i) {
        let pattern = patternNo.find(p => p.frame == i);
        if (pattern) {
            frameArray.push(pngArray[pattern.pngID]);
        } else {
            frameArray.push(frameArray[frameArray.length - 1]);
        }
    }
    frameArray = frameArray.filter(e => e);
    // console.table(frameArray)


    // set tmp png
    let i = 0;
    for (let png of frameArray) {
        let { rawPng, x, y, pngName } = png;
        ++i;

        let canva = await new Promise((resolve, reject) => {
            Jimp.create(centerX + width, centerY + height).then(resolve).catch(reject);
        });
        // console.log(i, png.pngName);

        canva.composite(rawPng, centerX - x, centerY - y);
        canva.writeAsync(`tmp/frame${i.toString().padStart(3, '0')}.png`);
    }


    // output apng/gif
    await sleep(500);
    try {
        let apngCmd = `..\\Utilities\\apngasm ..\\out\\${filename} frame*.png 1 50`;
        // console.log(apngCmd)
        console.log(child_process.execSync(`${apngCmd}`, { cwd: `./tmp` }).toString());
        console.log(child_process.execSync(`..\\Utilities\\apng2gif.exe ..\\out\\${filename}`, { cwd: `./tmp` }).toString());
    } catch (e) {
        console.log(e.stdout.toString());
    }

    // del tmp png
    for (let fname of getFileList(`./tmp`)) {
        fs.unlinkSync(fname);
    }
}


const main = async () => {

    if (!fs.existsSync(resourcesPath)) { fs.mkdirSync(resourcesPath); }
    if (!fs.existsSync(`./tmp`)) { fs.mkdirSync(`./tmp`); }
    if (!fs.existsSync(`./out`)) { fs.mkdirSync(`./out`); }
    console.log(`resourcesPath: ${resourcesPath}\n`);

    let basepath = `C:/LineBot/AigisTools/AigisTools/out/files/BattleEffect.aar`
    let arrList = getFileList(basepath);
    let done = [];
    for (let arr of arrList) {
        if (!/([^\/]+)\.aar\/([^\/]+)\.aod/.test(arr)) { continue; }

        let [, aodName] = arr.match(/\.aar\/([^\/]+\.aod)/);
        if (done.includes(aodName)) { continue; }

        await aodToApng(`${basepath}/${aodName}`);
        done.push(aodName);
    }



};
main();







