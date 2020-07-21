
const fs = require("fs");
const dbox = require("./dbox.js");

const main = async function () {
    eval(fs.readFileSync("./debug.js").toString());
    
    console.log(`process.env.DROPBOX_ACCESS_TOKEN = "${process.env.DROPBOX_ACCESS_TOKEN}"\n`);

    console.log("CharaDatabase.json uploading...");

    try {
        await dbox.fileBackup("CharaDatabase.json");
        await dbox.fileUpload("CharaDatabase.json", fs.readFileSync("./CharaDatabase.json").toString());

        console.log(this.name + " uploaded!");
        return true;
    } catch (error) {
        console.log(this.name + " uploading error...");
        throw error;
    }
}; main();