// file: sample.js
const fs = require('fs');

let filepath = "./AigisTools/";
let filepathA = "./AigisTools/";
let filepathR = "./AigisTools/";
let cachepath = "./AigisTools/Data/Cache/net/";
// 
module.exports = {
    summary: 'AigisTools auxiliary proxy',

    *beforeSendResponse(requestDetail, responseDetail) {
        // skip null response
        if (responseDetail.response.body.length == 0) return null;

        let url = requestDetail.url;

        if (/[0-9a-f]{40}\/[0-9a-z]{32}/i.test(url)) {
            // list all resource
            let [, part1, part2] = url.match(/([0-9a-f]{40})\/([0-9a-z]{32})/i);

            if (!fs.existsSync(`${cachepath}${part1}`)) {
                fs.mkdirSync(`${cachepath}${part1}`, { recursive: true });
            }

            // fs.writeFileSync("list.txt", `${url}\n`, { encoding: 'utf8', flag :'a' });

            // keep Cache 
            (() => { fs.writeFileSync(`${cachepath}${part1}/${part2}`, responseDetail.response.body, { encoding: "binary" }); }).call();
            console.log(url);
            fs.writeFileSync('list.har', `${url}\n`, { flag: 'a' })
        }

        if (url.indexOf('/1fp32igvpoxnb521p9dqypak5cal0xv0') != -1 || url.indexOf('/2iofz514jeks1y44k7al2ostm43xj085') != -1) {
            // get AigisR/Aigis file list
            console.log(url);
            fs.writeFileSync('list.har', `${url}\n`, { flag: 'a' })

            // update filepath
            // get Thursday date
            let updateTime = Date.now();
            while (new Date(updateTime).getDay() != 4) { updateTime -= 86400000; }

            // get XML folder name
            // aigis_2021_00_00R
            let updateDate = new Date(updateTime);
            let folderName = "aigis_" +
                updateDate.getFullYear().toString() + "_" +
                (updateDate.getMonth() + 1).toString().padStart(2, "0") + "_" +
                updateDate.getDate().toString().padStart(2, "0");

            // get filepath
            filepathA = "./AigisTools/Data/XML/" + folderName + "/"
            filepathR = "./AigisTools/Data/XML/" + folderName + "R/"
            if (url.indexOf('1fp32igvpoxnb521p9dqypak5cal0xv0') == -1) {
                filepath = filepathA;
            } else {
                filepath = filepathR;
                folderName = folderName + "R";
            }

            // check dir
            if (!fs.existsSync(filepath)) { fs.mkdirSync(filepath, { recursive: true }); }
            if (!fs.existsSync(filepathA)) { fs.mkdirSync(filepathA, { recursive: true }); }
            if (!fs.existsSync(filepathR)) { fs.mkdirSync(filepathR, { recursive: true }); }

            // xml.txt
            fs.writeFile("./AigisTools/xml.txt", folderName, (err) => { if (err) console.log(err); else console.log('xml.txt   has been saved!'); });
            fs.writeFile(filepath + "xml.txt", folderName, (err) => { if (err) console.log(err); else console.log('xml.txt   backup has been saved!'); });

            // files.txt
            fs.writeFile("./AigisTools/files.txt", url, (err) => { if (err) console.log(err); else console.log('files.txt has been saved!'); });
            fs.writeFile(filepath + "files.txt", url, (err) => { if (err) console.log(err); else console.log('files.txt backup has been saved!'); });

        }
        if (url.indexOf('/GRs733a4') != -1 || url.indexOf('/QxZpjdfV') != -1) {
            // units information / missions information
            console.log(url);
            fs.writeFileSync('list.har', `${url}\n`, { flag: 'a' })

            if (/(\S{8})$/.test(url)) {
                let filename = /(\S{8})$/.exec(url)[0];
                fs.writeFile(filepathA + filename, responseDetail.response.body.toString("base64"), (err) => { if (err) console.log(err); else console.log(filename + ' has been saved!'); });
                fs.writeFile(filepathR + filename, responseDetail.response.body.toString("base64"), (err) => { if (err) console.log(err); else console.log(filename + ' has been saved!'); });
            }
        }
        // if (url.indexOf('/oS5aZ5ll') != -1) {
        //     // army information
        //     console.log(url);

        //     if (/(\S{8})$/.test(url)) {
        //         let filename = /(\S{8})$/.exec(url)[0];
        //         fs.writeFile(filepath + filename, responseDetail.response.body.toString("base64"), (err) => { if (err) console.log(err); else console.log(filename + ' has been saved!'); });
        //     }
        // }
        // if (/\/[\S]{8}$/.test(url)) {
        //     console.log(url);

        //     if (/(\S{8})$/.test(url)) {
        //         let filename = /(\S{8})$/.exec(url)[0];
        //         fs.writeFile(filepath + filename, responseDetail.response.body.toString("base64"), (err) => { if (err) console.log(err); else console.log(filename + ' has been saved!'); });
        //     }
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
    }
};