// file: sample.js
const fs = require('fs');

let xmlspath = "./AigisTools/Data/XML";
let filepath = "./AigisTools/Data/XML";
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
            let folderName = "aigis_" +
                updateDate.getFullYear().toString() + "_" +
                (updateDate.getMonth() + 1).toString().padStart(2, "0") + "_" +
                updateDate.getDate().toString().padStart(2, "0");

            // get 2 version url
            let urlR = url.replace('/2iofz514jeks1y44k7al2ostm43xj085', '/1fp32igvpoxnb521p9dqypak5cal0xv0');
            let urlA = url.replace('/1fp32igvpoxnb521p9dqypak5cal0xv0', '/2iofz514jeks1y44k7al2ostm43xj085');

            // get filepath
            xmlspath = `./AigisTools/Data/XML`;
            filepath = `./AigisTools/Data/XML/${folderName}`;

            // check dir
            if (!fs.existsSync(xmlspath)) { fs.mkdirSync(xmlspath, { recursive: true }); }
            if (!fs.existsSync(filepath)) { fs.mkdirSync(filepath, { recursive: true }); }

            // Desktop A.txt
            fs.writeFile(`${xmlspath}/Desktop A.txt`, urlA, (err) => { if (err) console.log(err); else console.log(`Desktop A.txt has been saved!`); });
            fs.writeFile(`${filepath}/Desktop A.txt`, urlA, (err) => { if (err) console.log(err); else console.log(`Desktop A.txt backup has been saved!`); });
            // Desktop R.txt
            fs.writeFile(`${xmlspath}/Desktop R.txt`, urlR, (err) => { if (err) console.log(err); else console.log(`Desktop R.txt has been saved!`); });
            fs.writeFile(`${filepath}/Desktop R.txt`, urlR, (err) => { if (err) console.log(err); else console.log(`Desktop R.txt backup has been saved!`); });

            filelist = true;
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
            ]
            let [, xmlName] = url.match(/\/(\S{8})$/);

            if (xmlTarget.includes(xmlName)) {
                let body = responseDetail.response.body.toString("base64");
                fs.writeFile(`${xmlspath}/${xmlName}`, body, (err) => { if (err) console.log(err); else console.log(`${xmlName} has been saved!`); });
                fs.writeFile(`${filepath}/${xmlName}`, body, (err) => { if (err) console.log(err); else console.log(`${xmlName} backup has been saved!`); });

                if (!filelist) {
                    console.log(`${COLOR.fgRed}${COLOR.bright}didn't found filelist request, plz delete browser disk cache first!!${COLOR.reset}`);
                }
            } else if (xmlSubTarget.includes(xmlName)) {
                let body = responseDetail.response.body.toString("base64");
                fs.writeFile(`${xmlspath}/${xmlName}`, body, (err) => { if (err) console.log(err); else console.log(`${xmlName} has been saved!`); });

                if (!filelist) {
                    console.log(`${COLOR.fgRed}${COLOR.bright}didn't found filelist request, plz delete browser disk cache first!!${COLOR.reset}`);
                }
            }
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