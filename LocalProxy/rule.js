// file: sample.js
const fs = require('fs');
const child_process = require('child_process');

let xmlspath = "../AigisTools/Data/XML";
let filepath = "../AigisTools/Data/XML";
// let cachepath = "./AigisTools/Data/Cache/net/";
let filelist = false;

const COLOR = {
    reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
    underscore: '\x1b[4m', blink: '\x1b[5m', reverse: '\x1b[7m', hidden: '\x1b[8m',

    fgBlack: '\x1b[30m', fgRed: '\x1b[31m', fgGreen: '\x1b[32m', fgYellow: '\x1b[33m',
    fgBlue: '\x1b[34m', fgMagenta: '\x1b[35m', fgCyan: '\x1b[36m', fgWhite: '\x1b[37m',

    bgBlack: '\x1b[40m', bgRed: '\x1b[41m', bgGreen: '\x1b[42m', bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m', bgMagenta: '\x1b[45m', bgCyan: '\x1b[46m', bgWhite: '\x1b[47m',
};

let towerLevelKey = {
    'fwzbngzy0orswf3': 1,  // 154880
    'boncacfko8fdjq3': 2,  // 124400
    'o946xfoj2xswyq1': 3,  // 161920
    '4vhksdry7mkpncu': 4,  // 142800
    'oe68v0rgojvejx0': 5,  // 154000
    'x7gcg020lpw08zp': 6,  // 125580
    's4uoanvbbg1665w': 7,  // 159620
    '0jiecxcvcv87cmo': 8,  // 108680
    'sd3yzlviuw1ai5j': 9,  // 97660
    's2epsi7y9w1hxg0': 10, // 159620
    'l1k7y62j15ynzxr': 11, // 147200
    'p29v4lzqs9xx09f': 12, // 151360
    '6hlyv5h3cj8um4n': 13, // 140800
    '65dlsuc75uqzsl8': 14, // 128040
    'j8y0aba064x8hvl': 15, // 141680
    'ymlhqcfa13tqxcs': 16, // 150480
    'ezaa68x9ottxpsh': 17, // 117200
    'xq0v212ix42cwu4': 18, // 141680
    'h0kpffvr38ou3z7': 19, // 129360
    'j53g2mydf6jhviw': 20, // 141680
    'qnaowe38mbui577': 21, // 112860
    'pcd7hjzyrglefbi': 22, // 163760
    'wrdu8d49auwp096': 23, // 71060
    'vjptkjmfhjwflpq': 24, // 146280
    'afqyaff5f5yxqdr': 25, // 146740
    'wue9bocr092xnzk': 26, // 161920
    'cvy19eany62bee6': 27, // 169920
    'gbftdy0mgpvou5a': 28, // 107160
    'nlas453x47j78a3': 29, // 128520
    '754zzog7jouyvuq': 30, // 101600
    '238rlcw1qrf8kc9': 31, // 133980
    'aghof5nfmp3stlq': 32, // 64020
    'dchlfr07ms67810': 33, // 146080
    'syzqbc4oz963yh4': 34, // 156200
    '2fdrle6cc9u7lga': 35, // 94000
    '7flh6d72yf2p0p0': 36, // 147200
    '4n96ht4n78mkldg': 37, // 157780
    'mwtaokaeqt63n5w': 38, // 157440
    'opxkd3qz264jlxf': 39, // 157920
    '7oa6yqrz7fgvgnc': 40  // 159840
}


module.exports = {
    summary: 'AigisTools auxiliary proxy',

    *beforeSendResponse(requestDetail, responseDetail) {
        // skip null response
        if (responseDetail.response.body.length == 0) return null;

        let url = requestDetail.url;
        // console.log(url);

        // filelist url
        if (url.indexOf('/1fp32igvpoxnb521p9dqypak5cal0xv0') != -1 || url.indexOf('/2iofz514jeks1y44k7al2ostm43xj085') != -1) {
            // get AigisR/Aigis file list
            console.log(`${COLOR.fgRed}${url}${COLOR.reset}`);

            // update filepath
            // get Thursday date
            let updateTime = Date.now();
            while (new Date(updateTime).getDay() != 4) { updateTime -= 86400000; }

            // get XML folder name
            // folderName = aigis_2021_00_00
            let updateDate = new Date(updateTime);
            let year = updateDate.getFullYear().toString();
            let month = (updateDate.getMonth() + 1).toString().padStart(2, "0");
            let date = updateDate.getDate().toString().padStart(2, "0");
            let folderName = `aigis_${year}_${month}_${date}`;
            let commitName = `update${month}${date}`;

            // get 2 version url
            let urlR = url.replace('/2iofz514jeks1y44k7al2ostm43xj085', '/1fp32igvpoxnb521p9dqypak5cal0xv0');
            let urlA = url.replace('/1fp32igvpoxnb521p9dqypak5cal0xv0', '/2iofz514jeks1y44k7al2ostm43xj085');


            // get filepath
            xmlspath = `../AigisTools/Data/XML`;
            // check dir
            if (!fs.existsSync(xmlspath)) { fs.mkdirSync(xmlspath, { recursive: true }); }
            // Desktop A/R.txt
            fs.writeFile(`${xmlspath}/Desktop A.txt`, urlA, (err) => { if (err) console.log(err); else console.log(`Desktop A.txt has been saved!`); });
            fs.writeFile(`${xmlspath}/Desktop R.txt`, urlR, (err) => { if (err) console.log(err); else console.log(`Desktop R.txt has been saved!`); });

            fs.writeFile(`../4_push.bat`, [
                `git add -A\ngit commit -m ${commitName}\ngit push\n`,
                `cd .\\AigisTools\n`,
                `git add -A\ngit commit -m ${commitName}\ngit push\n`,
            ].join('\n'), (err) => { if (err) console.log(err); else console.log(`push.bat has been saved!`); });


            // get filepath
            filepath = `../AigisTools/Data/XML/${folderName}`;
            // check dir
            if (!fs.existsSync(filepath)) { fs.mkdirSync(filepath, { recursive: true }); }
            else {
                console.log(`${COLOR.fgRed}${COLOR.bright}found ${filepath} folder, plz delete old version first!!${COLOR.reset}`);
                return null;
                // for debug
                fs.renameSync(filepath, filepath + "_");
                fs.mkdirSync(filepath, { recursive: true });
            }
            // Desktop A/R.txt
            fs.writeFile(`${filepath}/Desktop A.txt`, urlA, (err) => { if (err) console.log(err); else console.log(`Desktop A.txt backup has been saved!`); });
            fs.writeFile(`${filepath}/Desktop R.txt`, urlR, (err) => { if (err) console.log(err); else console.log(`Desktop R.txt backup has been saved!`); });


            filelist = true;
            return null;
        }

        // get xml
        else if (/\/(\S{8})$/.test(url)) {
            console.log(`${COLOR.fgYellow}${url}${COLOR.reset}`);

            let xmlTarget = [
                'GRs733a4', // units information
                'QxZpjdfV', // missions information
            ]
            let xmlSubTarget = [
                'oS5aZ5ll', // army information
                'aE7DRVtp', // tower information
            ]
            let [, xmlName] = url.match(/\/(\S{8})$/);
            // skip if not target
            if (!xmlTarget.includes(xmlName) && !xmlSubTarget.includes(xmlName)) { return null; }

            // tower information
            if (xmlName == 'aE7DRVtp') {
                // del old xml
                if (fs.existsSync(`${xmlspath}/${xmlName}`)) { fs.unlinkSync(`${xmlspath}/${xmlName}`); }

                // get xml data file
                let body = responseDetail.response.body.toString("base64");
                fs.writeFileSync(`${xmlspath}/${xmlName}`, body, (err) => { if (err) console.log(err); else console.log(`${xmlName} has been saved!`); });

                // do xml raw
                child_process.execSync(`do xml aE7DRVtp raw`, { cwd: `../AigisTools` }).toString().trim();

                // read xml raw
                let xml = fs.readFileSync(`..\\AigisTools\\out\\aE7DRVtp.xml`).toString();
                let regKey = /ExchangeKey<\/V><\/KEY><VALUE T=\"S\"><V>(\S{15})<\/V>/;
                let regScore = /<Score T=\"I\"><V>(\d+)<\/V>/;

                if (regKey.test(xml) && regScore.test(xml)) {
                    let [, key] = xml.match(regKey);
                    let [, score] = xml.match(regScore);
                    let lv = towerLevelKey[key] || key;

                    console.log(lv.toString().padStart(2, ' '), score);
                }

                return null;
            }


            // get xml data file
            let body = responseDetail.response.body.toString("base64");
            // save file data
            fs.writeFileSync(`${xmlspath}/${xmlName}`, body, (err) => { if (err) console.log(err); else console.log(`${xmlName} has been saved!`); });


            if (!filelist) {
                // wait file list
                console.log(`${COLOR.fgRed}${COLOR.bright}didn't found filelist request, plz delete browser disk cache first!!${COLOR.reset}`);
                return null;

            } else if (xmlTarget.includes(xmlName)) {
                // save file data backup
                fs.writeFileSync(`${filepath}/${xmlName}`, body, (err) => { if (err) console.log(err); else console.log(`${xmlName} backup has been saved!`); });

            }


            // xcopy
            // check download all done?
            let dlflag = true;
            for (let key of xmlTarget) {
                if (!fs.existsSync(`${filepath}/${key}`)) { dlflag = false; }
            }
            // call next step script
            if (dlflag) {
                // console.log(child_process.execSync(`xcopy .\\AigisTools ..\\AigisTools /Y /S /I`).toString());
                child_process.exec(`cd ..&start 2.1_AigisLoader.bat`);
				process.exit();
				
            }

            return null;
        }

        // else {
        //     console.log(url);
        // }

        return null;
    },

    *beforeDealHttpsRequest(requestDetail) {
        let hostlist = [
            "millennium-war.net:443",    // AigisR units information / missions information
            "all.millennium-war.net:443",    // Aigis units information / missions information
            "drc1bk94f7rq8.cloudfront.net:443"
        ];
        return (hostlist.indexOf(requestDetail.host) != -1);
        // console.log(requestDetail.host)
        // return true;
    }
};