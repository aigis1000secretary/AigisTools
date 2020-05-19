// file: sample.js
const fs = require('fs');

let filepath = "./AigisTools/";
// 
module.exports = {
    summary: 'AigisTools auxiliary proxy',

    *beforeSendResponse(requestDetail, responseDetail) {
        // skip null response
        if (responseDetail.response.body.length == 0) return null;

        let url = requestDetail.url;

        if (url.indexOf('/1fp32igvpoxnb521p9dqypak5cal0xv0') != -1 || url.indexOf('/2iofz514jeks1y44k7al2ostm43xj085') != -1) {
            // get AigisR/Aigis file list
            console.log(url);

            // update filepath
            // get Thursday date
            let updateTime = Date.now();
            while (new Date(updateTime).getDay() != 4) { updateTime -= 86400000; }
            // get XML folder name            
            let updateDate = new Date(updateTime);
            let folderName = "aigis_" +
                updateDate.getFullYear().toString() + "_" +
                (updateDate.getMonth() + 1).toString().padStart(2, "0") + "_" +
                updateDate.getDate().toString().padStart(2, "0") +
                (url.indexOf('1fp32igvpoxnb521p9dqypak5cal0xv0') != -1 ? "R" : "");
            // get filepath 
            filepath = "./AigisTools/Data/XML/" + folderName + "/";

            // check dir
            if (!fs.existsSync(filepath)) { fs.mkdirSync(filepath, { recursive: true }); }

            // xml.txt
            fs.writeFile("./AigisTools/xml.txt", folderName, (err) => { if (err) console.log(err); else console.log('xml.txt   has been saved!'); });
            fs.writeFile(filepath + "xml.txt", folderName, (err) => { if (err) console.log(err); else console.log('xml.txt   backup has been saved!'); });

            // files.txt
            fs.writeFile("./AigisTools/files.txt", url, (err) => { if (err) console.log(err); else console.log('files.txt has been saved!'); });
            fs.writeFile(filepath + "files.txt", url, (err) => { if (err) console.log(err); else console.log('files.txt backup has been saved!'); });

        } else if (url.indexOf('/GRs733a4') != -1 || url.indexOf('/QxZpjdfV') != -1) {
            // units information / missions information
            console.log(url);

            if (/(\S{8})$/.test(url)) {
                let filename = /(\S{8})$/.exec(url)[0];
                fs.writeFile(filepath + filename, responseDetail.response.body.toString("base64"), (err) => { if (err) console.log(err); else console.log(filename + ' has been saved!'); });
            }
        }

        return null;
    },

    *beforeDealHttpsRequest(requestDetail) {
        let hostlist = [
	        "millennium-war.net:443",    // AigisR units information / missions information
	        "all.millennium-war.net:443"    // Aigis units information / missions information
        ];
        return (hostlist.indexOf(requestDetail.host) != -1);
    }
};