
let maxLevel = [
    [40, 50, 50, 50, 50, 50, 50],
    [40, 50, 55, 60, 65, 70, 80],
    [40, 50, 55, 99, 99, 99, 99]
];
let plane1Config = [
    ["expAmour", 2],
    ["expPreseil", 3],
    ["expAlegria", 3],
    ["expLiebe", 4],
    ["expFreude", 5],
    ["expFarah", 6],
    ["expPresent", -1],
    ["expPlacer", -1]
];
let customizeConfig = [ // rare
    // female, male, class bonus
    [0, 40, 10],        // 0    アイアン
    [0, 70, 30],        // 1    ブロンズ
    [150, 300, 50],     // 2    シルバー
    [250, 750, 80],     // 3    ゴールド
    [250, 750, 90],     // 4    サファイア
    [500, 1500, 100],   // 5    プラチナ
    [1000, 2000, 300],  // 6    ブラック
];


// body onload method
let bodyOnload = () => {
    // init card box
    setMaxLevel();
    setExpLimit();

    // set button event
    for (let btn of document.querySelector(".leftcolumn").getElementsByTagName("input")) {
        if (btn.value == "MIN") {
            btn.addEventListener("click", function (e) {
                let input = this.nextElementSibling.nextElementSibling;
                input.value = input.min;
                calc();
            }, false);

        } else if (btn.value == "－") {
            btn.addEventListener("click", function (e) {
                let input = this.nextElementSibling;
                input.value = Math.max(input.min, parseInt(input.value) - 1);
                calc();
            }, false);

        } else if (btn.value == "＋") {
            btn.addEventListener("click", function (e) {
                let input = this.previousElementSibling;
                input.value = Math.min(input.max, parseInt(input.value) + 1);
                calc();
            }, false);
        } else if (btn.value == "MAX") {
            btn.addEventListener("click", function (e) {
                let input = this.previousElementSibling.previousElementSibling;
                input.value = input.max;
                calc();
            }, false);

        } else if (btn.type == "number") {
            if (!isMobile()) { btn.addEventListener("mouseover", (e) => { btn.select(); }, false); }
            btn.addEventListener("change", calc, false);
            btn.addEventListener("keydown", (e) => {
                if (btn.max != "" && e.key == 'End') { btn.value = btn.max; calc(); }    // end  e.keyCode == 36
                if (btn.min != "" && e.key == 'Home') { btn.value = btn.min; calc(); }   // home e.keyCode == 35
            }, false);
        }
    }
    if (!isMobile()) {
        for (let btn of document.querySelectorAll("select")) {
            btn.addEventListener("mouseover", (e) => { btn.focus(); }, false);
        }
    }

    // free exp event
    for (let name of ["expFree01", "expFree02", "expFree03", "expFree04"]) {
        let div = document.getElementById(name).querySelector(".box1");
        div.style.cursor = "pointer";
        div.addEventListener("click", function (e) {
            this.innerHTML = prompt(`【自由欄${name[name.length - 1]}】`, this.innerHTML) || `【自由欄${name[name.length - 1]}】`;
        }, false);
    }

    // box title event
    {
        let div = document.getElementById("boxtitle");
        div.style.cursor = "pointer";
        div.addEventListener("click", function (e) {
            this.innerHTML = prompt(`名前入力`, this.innerHTML) || `育成計画`;
        }, false);
    }

    // scroll event
    if (!isMobile()) {
        $(window).scroll(() => {
            let div = document.getElementById("remainingEXP").parentElement.parentElement;
            div.style.paddingTop = `${Math.max(0, $(this).scrollTop() - 370)}px`;
        });
    }

    loadData();

    // update UI
    // calc
    updateUI(true);
}


// input data api
let setRarity = (r) => {
    document.getElementById("selectRarity").selectedIndex = r;
    // update UI
    setMaxLevel()
    setExpLimit()
}
let setLevel = (lv) => {
    document.getElementById("selectCurrentLevel").selectedIndex = lv - 1;
    // update UI
    setExpLimit()
}
let setTargetLevel = (lv) => {
    document.getElementById("selectTargetLevel").selectedIndex = lv - 1;
}
let getRarity = () => {
    return document.getElementById("selectRarity").selectedIndex;
}
let getLevel = () => {
    return document.getElementById("selectCurrentLevel").selectedIndex + 1;
}
let getTargetLevel = () => {
    return document.getElementById("selectTargetLevel").selectedIndex + 1;
}
let getNext = () => {
    let div = document.getElementById("inputNext");
    if (div.value == "") { div.value = div.max; }
    return div.value * 1;
}

// input button event
let changeSelectRarity = () => {
    setMaxLevel();
    setExpLimit();

    calc();
}
let changeSelectCurrentLevel = () => {
    setExpLimit();

    calc();
}
let changeSelectTargetLevel = () => {
    calc();
}
let setLevelRange = (lv, tLv, r = 0) => {
    setRarity(r);
    setLevel(lv);
    setTargetLevel(tLv);

    calc();
}

// html result to image
let openImage = function () {
    $(window).scrollTop(0);
    document.getElementById("remainingEXP").parentElement.parentElement.style.paddingTop = `0px`;
    html2canvas(document.getElementById("expcalc")).then(function (canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        window.open().document.write(`<img src="${image.src}" />`);
    });
}

// UI method
// input zone
let setMaxLevel = () => {
    let r = getRarity();
    document.getElementById("selectCurrentLevel").options.length = maxLevel[2][r];
    document.getElementById("selectTargetLevel").options.length = maxLevel[2][r];
    for (i = 0; i < maxLevel[2][r]; i++) {
        document.getElementById("selectCurrentLevel").options[i].text = (i + 1);
        document.getElementById("selectTargetLevel").options[i].text = (i + 1);
    }
    // set Plane1 Visable
    for (let cfg of plane1Config) {
        if (r == 0 ||   // for debug
            cfg[1] == -1 || // for all rare
            cfg[1] == r) {  // for defined rare
            document.getElementById(cfg[0]).classList.add("show");
        } else {
            document.getElementById(cfg[0]).classList.remove("show");
            document.getElementById(cfg[0]).classList.remove("keep");
        }
    }
}
let setExpLimit = () => {
    let r = getRarity();
    let l = getLevel();
    document.getElementById("inputNext").value = expTable[l][r + 1];
    document.getElementById("inputNext").min = 1;
    document.getElementById("inputNext").max = expTable[l][r + 1];
}
// plane zone
let updateUI = (checkSariette = false) => {
    if (checkSariette) {
        let r = document.getElementById("checkSariette").checked ? 1.1 : 1.0

        document.getElementById("expWArmor1").querySelector(".box2").innerHTML = Math.floor(1000 * r);
        document.getElementById("expWArmor").querySelector(".box2").innerHTML = Math.floor(8000 * r);
        document.getElementById("expBArmor").querySelector(".box2").innerHTML = Math.floor(40000 * r);
        document.getElementById("expAmour").querySelector(".box2").innerHTML = Math.floor(4000 * r);
        document.getElementById("expPreseil").querySelector(".box2").innerHTML = Math.floor(1750 * r);
        document.getElementById("expAlegria").querySelector(".box2").innerHTML = Math.floor(18000 * r);
        document.getElementById("expLiebe").querySelector(".box2").innerHTML = Math.floor(19000 * r);
        document.getElementById("expFreude").querySelector(".box2").innerHTML = Math.floor(19000 * r);
        document.getElementById("expFarah").querySelector(".box2").innerHTML = Math.floor(20000 * r);
        document.getElementById("expPresent").querySelector(".box2").innerHTML = Math.floor(18000 * r);
        document.getElementById("expPlacer").querySelector(".box2").innerHTML = Math.floor(10000 * r);
        document.getElementById("expEmperor01").querySelector(".box2").innerHTML = Math.floor(16000 * r);
        document.getElementById("expEmperor17").querySelector(".box2").innerHTML = Math.floor(18560 * r);
        document.getElementById("expEmperor20").querySelector(".box2").innerHTML = Math.floor(19040 * r);
        document.getElementById("expB01").querySelector(".box2").innerHTML = (235 * r).toFixed(1).replace(/\.0$/, "");
        document.getElementById("expB02").querySelector(".box2").innerHTML = (265 * r).toFixed(1).replace(/\.0$/, "");
        document.getElementById("expB03").querySelector(".box2").innerHTML = (220 * r).toFixed(1).replace(/\.0$/, "");
        document.getElementById("expB04").querySelector(".box2").innerHTML = (250 * r).toFixed(1).replace(/\.0$/, "");
    }

    // EXP customize options
    let expNameList = [
        "expC01", "expC02", "expC03", "expC04",
        "expS01", "expS02"    // 強襲ミッションドロップ base 750 exp
    ];
    for (let name of expNameList) {
        let div = document.getElementById(name);
        // setting
        let rare = div.querySelector(".rare").selectedIndex;  // 0~6
        let sex = div.querySelector(".sex").selectedIndex;    // 0~1 女:男
        let cc = div.querySelector(".cc").selectedIndex;    // 0~2
        let lv = div.querySelector('.lv').value * 1; // 0~99
        let cbonus = div.querySelector(".cbonus").checked ? 1 : 0;
        // variable
        let ccexp = [0, 1].includes(rare) ? 5 : [7, 20, 50][cc];
        let r = document.getElementById("checkSariette").checked ? 1.1 : 1.0

        // check selected
        if ([0, 1].includes(rare)) {
            // 鉄銅
            sex = div.querySelector(".sex").selectedIndex = 1;  // 男
            cc = div.querySelector(".cc").selectedIndex = 0;    // no cc
        } else if (rare == 2 && cc == 2) {
            // 銀
            cc = div.querySelector(".cc").selectedIndex = 1;    // no aw
        }
        if (lv > maxLevel[cc][rare]) {
            lv = div.querySelector('.lv').value = maxLevel[cc][rare];
        }

        let exp = customizeConfig[rare][sex];
        if (name == "expS01") { exp = 750; }
        if (name == "expS02") { exp = 2000; }
        exp += cbonus * customizeConfig[rare][2];
        exp += (lv - 1) * ccexp;
        exp = (exp * r).toFixed(1).replace(/\.0$/, "");;

        div.querySelector(".box2").innerHTML = exp;
    }

    calc();
}
let calc = () => {
    // necessaryEXP
    let sumEXP = getNext();
    let currentRarity = getRarity();
    let currentLevel = getLevel();
    let currentTargetLevel = getTargetLevel();

    for (i = currentLevel + 1; i <= currentTargetLevel - 1; i++) {
        sumEXP += expTable[i][currentRarity + 1];
    }
    if (currentLevel < currentTargetLevel) {
        document.getElementById("necessaryEXP").innerHTML = sumEXP;
    } else {
        sumEXP = -1;
        document.getElementById("necessaryEXP").innerHTML = "-";
    }

    // remainingEXP
    let sumAdditionalEXP = 0;
    expNameList = [
        "expWArmor1", "expWArmor", "expBArmor",
        "expAmour", "expPreseil", "expAlegria", "expLiebe", "expFreude", "expFarah", "expPresent", "expPlacer",
        "expEmperor01", "expEmperor17", "expEmperor20",
        "expB01", "expB02", "expB03", "expB04",
        "expC01", "expC02", "expC03", "expC04", "expS01", "expS02"
    ];
    for (let name of expNameList) {
        let div = document.getElementById(name);

        let check = plane1Config.find(e => e[0] == name);
        if (check != null &&    // config defined
            check[1] != -1 &&   // not for all rare
            check[1] != currentRarity)  // not for this rare
        { continue; }

        let addExp =
            (div.querySelector(".box2").innerHTML * 1) *
            (div.querySelector('.count').value * 1);
        addExp = Math.floor(addExp);

        if (addExp) {
            sumAdditionalEXP += addExp;
            // set UI classname
            div.classList.add("keep");
        } else {
            div.classList.remove("keep");
        }
    }

    expNameList = ["expFree01", "expFree02", "expFree03", "expFree04"];
    for (let name of expNameList) {
        let div = document.getElementById(name);

        let addExp =
            (div.querySelector(".freeExp").value * 1) *
            (div.querySelector('.count').value * 1);
        addExp = Math.floor(addExp);

        if (addExp || (div.querySelector(".freeExp").value * 1) > 0) {
            sumAdditionalEXP += addExp;
            // set UI classname
            div.classList.add("keep");
        } else {
            div.classList.remove("keep");
        }
    }

    if (sumEXP >= 0) {
        document.getElementById("remainingEXP").innerHTML = sumEXP - sumAdditionalEXP;
        saveData();
    } else {
        document.getElementById("remainingEXP").innerHTML = "-";
        clearData();
    }
}

// let keymap = [
//     ['.ra', ' .rare'], ['.se', ' .sex'], ['.cc', ' .cc'], ['.cb', ' .cbonus'], ['.lv', ' .lv'], ['.fe', ' .freeExp'], ['.co', ' .count'],
//     ['sR', '#selectRarity'], ['sC', '#selectCurrentLevel'], ['iN', '#inputNext'], ['sT', '#selectTargetLevel'], ['cS', '#checkSariette'],
//     ['P1', '#Panel1'], ['P2', '#Panel2'], ['P3', '#Panel3'], ['P4', '#Panel4'], ['P5', '#Panel5'],
//     ['eW1', '#expWArmor1'], ['eW8', '#expWArmor'], ['eB1', '#expBArmor'],
//     ['eAm', '#expAmour'], ['ePr', '#expPreseil'], ['eAl', '#expAlegria'], ['eLi', '#expLiebe'], ['eFr', '#expFreude'], ['eFa', '#expFarah'], ['ePr', '#expPresent'], ['ePl', '#expPlacer'],
//     ['eE1', '#expEmperor01'], ['eE7', '#expEmperor17'], ['eE2', '#expEmperor20'],
//     ['eB1', '#expB01'], ['eB2', '#expB02'], ['eB3', '#expB03'], ['eB4', '#expB04'],
//     ['eF1', '#expFree01'], ['eF2', '#expFree02'], ['eF3', '#expFree03'], ['eF4', '#expFree04'],
//     ['eC1', '#expC01'], ['eC2', '#expC02'], ['eC3', '#expC03'], ['eC4', '#expC04'], ['eS1', '#expS01'], ['eS2', '#expS02']
// ];
let saveData = () => {
    let data = {};

    // get inputs
    let selectors = ["#boxtitle", "#expFree01 .box1", "#expFree02 .box1", "#expFree03 .box1", "#expFree04 .box1",
        '#selectRarity', '#selectCurrentLevel', '#inputNext', '#selectTargetLevel',
        '#checkSariette', '#Panel1', '#Panel2', '#Panel3', '#Panel4', '#Panel5'];
    for (let div of document.querySelectorAll('.training')) {
        if (!div.id) { continue; }
        selectors.push(`#${div.id} .rare`);
        selectors.push(`#${div.id} .sex`);
        selectors.push(`#${div.id} .cc`);
        selectors.push(`#${div.id} .cbonus`);
        selectors.push(`#${div.id} .lv`);
        selectors.push(`#${div.id} .freeExp`);
        selectors.push(`#${div.id} .count`);
    }

    for (let key of selectors) {
        let div = document.querySelector(key);
        if (!div) { continue; }

        // let key = selectors;
        // for (let [a, b] of keymap) {
        //     key = key.replace(b, a);
        // }

        let value;
        if (div.tagName == 'DIV') { value = div.innerHTML; }
        else if (div.tagName == 'SELECT') { value = div.selectedIndex; }
        else if (div.type == 'checkbox') { value = div.checked; }
        else if (div.type == 'number') { value = div.value * 1; }

        // document.cookie = `${key}=${value}`;
        data[key] = value;
    }

    localStorage.setItem('AigisToolsEXP', JSON.stringify(data));
}
let loadData = () => {
    let obj = {};
    try { obj = JSON.parse(localStorage.getItem('AigisToolsEXP')) } catch { }
    if (!obj) { return; }

    // set data to UI
    document.getElementById("checkSariette").checked = obj["#checkSariette"];
    document.getElementById("inputNext").checked = obj["#inputNext"];
    setRarity(obj["#selectRarity"]);
    setLevel(obj["#selectCurrentLevel"] + 1);
    setTargetLevel(obj["#selectTargetLevel"] + 1);

    let keys = ["#checkSariette", "#selectRarity", "#selectCurrentLevel", "#inputNext", "#selectTargetLevel"];
    for (let key of Object.keys(obj)) {
        if (keys.includes(key)) { continue; };
        let value = obj[key];

        let div = document.querySelector(key);
        if (!div) { continue; }
        else if (div.tagName == 'DIV') { div.innerHTML = value; }
        else if (div.tagName == 'SELECT') { div.selectedIndex = value; }
        else if (div.type == 'checkbox') { div.checked = value; }
        else if (div.type == 'number') { div.value = value; }
    }
}
let clearData = () => {
    localStorage.removeItem('AigisToolsEXP');
}


let isMobile = () => {
    let u = navigator.userAgent;
    let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    let isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    return isAndroid || isiOS;
}