
let maxLevel = [
    [40, 50, 50, 50, 50, 50, 50],
    [40, 50, 55, 60, 65, 70, 80],
    [40, 50, 55, 99, 99, 99, 99]
];
let panel0 = ["expWArmor1", "expWArmor", "expBArmor"];
let panel1 = [];    // ["expAmour", "expPreseil", "expAlegria", "expLiebe", "expFreude", "expFarah", "expPresent", "expPlacer"];
let panel2 = [];    // ["expEmperor01", "expEmperor17", "expEmperor20"];
let panel3 = [];    // ["expB01", "expB02", "expB03", "expB04"];
let panel4 = [];    // ["expFree01", "expFree02", "expFree03", "expFree04"];
let panel5 = [];    // ["expC01", "expC02", "expC03", "expC04", "expS01", "expS02"];

let panel1Config = {
    "expAmour": 2,
    "expPreseil": 3,
    "expAlegria": 3,
    "expLiebe": 4,
    "expFreude": 5,
    "expFarah": 6
};
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

    // get id list
    document.querySelectorAll("#Panel1+.accContent .training").forEach((e) => { panel1.push(e.id) })
    document.querySelectorAll("#Panel2+.accContent .training").forEach((e) => { panel2.push(e.id) })
    document.querySelectorAll("#Panel3+.accContent .training").forEach((e) => { panel3.push(e.id) })
    document.querySelectorAll("#Panel4+.accContent .training").forEach((e) => { panel4.push(e.id) })
    document.querySelectorAll("#Panel5+.accContent .training").forEach((e) => { panel5.push(e.id) })

    // set button event
    for (let btn of document.querySelector(".leftcolumn").getElementsByTagName("input")) {
        if (btn.value == "MIN") {
            btn.addEventListener("click", (e) => {
                let input = btn.nextElementSibling.nextElementSibling;
                input.value = input.min;
                calc();
            }, false);

        } else if (btn.value == "－") {
            btn.addEventListener("click", (e) => {
                let input = btn.nextElementSibling;
                input.value = Math.max(input.min, parseInt(input.value) - 1);
                calc();
            }, false);

        } else if (btn.value == "＋") {
            btn.addEventListener("click", (e) => {
                let input = btn.previousElementSibling;
                input.value = Math.min(input.max, parseInt(input.value) + 1);
                calc();
            }, false);
        } else if (btn.value == "MAX") {
            btn.addEventListener("click", (e) => {
                let input = btn.previousElementSibling.previousElementSibling;
                input.value = input.max;
                calc();
            }, false);

        } else if (btn.type == "number") {
            // auto focus
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
    for (let name of panel4) {
        let div = document.getElementById(name).querySelector(".box1");
        div.style.cursor = "pointer";
        div.addEventListener("click", (e) => {
            div.innerHTML = prompt(div.title, div.innerHTML) || div.title;
            // saveData();
        }, false);
    }

    // box title event
    {
        let div = document.getElementById("boxtitle");
        div.style.cursor = "pointer";
        div.addEventListener("click", (e) => {
            div.innerHTML = prompt(`名前入力`, div.innerHTML) || div.title;
            // saveData();
        }, false);
    }

    // scroll event
    if (!isMobile()) {
        $(window).scroll(() => {
            let div = document.getElementById("remainingEXP").parentElement.parentElement;
            // get unchanged data
            let offsetH0 = document.querySelector('#expcalc').offsetHeight;
            let padTop0 = div.style.paddingTop;
            // move remainingEXP
            div.style.paddingTop = `${Math.max(0, $(this).scrollTop() - 370)}px`;
            if (offsetH0 != document.querySelector('#expcalc').offsetHeight) {
                div.style.paddingTop = padTop0;
            }
        });
    }

    // custom quick button
    {
        // check old data
        checkExpData();

        // get now data
        let keys = listExpData();
        for (let key of keys) {
            let time = parseInt(key.substring(13)) || 0;
            let data = loadExpData(key);
            quickBtn_add(time, data)
        }
    }

    // update UI
    // calc
    updateUI();
    calc();
}

// html result to image
let openImage = () => {
    $(window).scrollTop(0);
    document.getElementById("remainingEXP").parentElement.parentElement.style.paddingTop = `0px`;
    html2canvas(document.getElementById("expcalc")).then((canvas) => {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        window.open().document.write(`<img src="${image.src}" />`);
    });
}
// UI API
// input button event
let changeSelectRarity = () => { setMaxLevel(); setExpLimit(); updateUI(); calc(); }
let changeSelectCurrentLevel = () => { setExpLimit(); calc(); }
let changeSelectTargetLevel = () => { calc(); }
// quick button event
let setLevelRange = (lv, tLv, r = 0) => {
    document.getElementById("selectRarity").selectedIndex = r; setMaxLevel();
    document.getElementById("selectCurrentLevel").selectedIndex = lv - 1; setExpLimit();
    document.getElementById("selectTargetLevel").selectedIndex = tLv - 1;
    updateUI();

    calc();
}
// custom quick button api
let quickBtn_add = (time, data) => {
    let btnbox = document.querySelector('#quickBtnBox');
    let rare = ['ir', 'br', 'si', 'go', 'sa', 'pl', 'bl'][data["#selectRarity"]]

    let btn = document.createElement('input');
    btn.className = 'custom';
    btn.classList.add(rare);
    btn.type = 'button';
    btn.value = data['#boxtitle'];                  // btn text
    btn.title = new Date(time).toLocaleString();    // time in date string
    btn.alt = time;                                 // time in number
    btn.addEventListener("click", quickBtn_click, false);

    btnbox.appendChild(btn);
}
// custom quick button event
let quickBtn_click = (e) => {
    let btn = e.target;
    let selected = btn.classList.contains('selected');
    for (let div of document.querySelectorAll('#quickBtnBox .selected')) {
        div.classList.remove('selected');
    }
    if (selected) {
        // action: disable selected (true to false)
        // resetExpData();
        return;
    }

    // action: enable selected (false to true)
    btn.classList.add('selected');
    // get key name
    let time = parseInt(btn.alt);
    let key = `AigisToolsEXP${time}`;
    let data = loadExpData(key);
    // set exp data
    setExpData(data);
    updateUI();
    calc();
}
let quickBtn_save = () => {
    let btn = document.querySelector('#quickBtnBox .selected');

    if (btn) {
        // selected data
        let isExecuted = confirm(`${btn.value}のデータを上書きしますか？`);
        if (isExecuted) {
            // overwrite
            let time = parseInt(btn.alt);
            let key = `AigisToolsEXP${time}`;
            let data = getExpData();
            // save
            saveExpData(key, data);
            // update btn value
            btn.value = data['#boxtitle'];
            return;
        }
    }

    // no overwrite or not selected
    // add new savedata
    let time = Date.now()
    let key = `AigisToolsEXP${time}`;
    let data = getExpData();
    // save
    saveExpData(key, data);
    // add custom button
    quickBtn_add(time, data);
}
let quickBtn_delete = () => {
    let btn = document.querySelector('#quickBtnBox .selected');
    let confirmString = btn ? `${btn.value}のデータを削除しますか？` : "現在のデータを削除しますか？"
    let isExecuted = confirm(confirmString);
    if (!isExecuted) { return; }

    // reset data or del data
    if (!btn) {
        resetExpData();
        return;
    }

    // get key name
    let time = parseInt(btn.alt);
    let key = `AigisToolsEXP${time}`;
    // delete exp data & button
    deleteExpData(key);
    btn.remove();
}
// panels
let changePanels = (div) => {
    if (div) { div.nextElementSibling.selectedIndex = 0; }
    updateUI();
    calc();
}

// input data 
let getRarity = () => { return document.getElementById("selectRarity").selectedIndex; }
let getLevel = () => { return document.getElementById("selectCurrentLevel").selectedIndex + 1; }
let getTargetLevel = () => { return document.getElementById("selectTargetLevel").selectedIndex + 1; }
let getNext = () => {
    let div = document.getElementById("inputNext");
    if (div.value == "") { div.value = div.max; }
    return div.value * 1;
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
}
let setExpLimit = () => {
    let r = getRarity();
    let l = getLevel();
    document.getElementById("inputNext").value = expTable[l][r + 1];
    document.getElementById("inputNext").min = 1;
    document.getElementById("inputNext").max = expTable[l][r + 1];
}
// Panel zone
let updateUI = () => {
    let r = document.getElementById('checkSariette').checked ? 1.1 : 1.0;

    // Plane0, Plane2
    for (let key of [].concat(panel0, panel2)) {
        let box2 = document.querySelector(`#${key} .box2`);
        box2.innerHTML = Math.floor(box2.title * r);
    }
    // Plane1
    for (let key of panel1) {
        let box2 = document.querySelector(`#${key} .box2`);
        box2.innerHTML = Math.floor(box2.title * r);

        // set Plane1 Visable
        let rare = getRarity();
        let check = panel1Config[key];
        if (check && rare != check) {   // requirement defined && same to rare
            box2.innerHTML = 0;
        }
        if (rare == 0 ||    // for debug
            !check ||       // for all rare
            rare == check) {// for defined rares
            document.getElementById(key).classList.add("show");
        } else {
            // document.getElementById(key).classList.add("show");  // for debug
            document.getElementById(key).classList.remove("show");
            document.getElementById(key).classList.remove("keep");
        }
    }
    // Plane3
    for (let key of panel3) {
        let box2 = document.querySelector(`#${key} .box2`);
        box2.innerHTML = (box2.title * r).toFixed(1).replace(/\.0$/, "");
    }

    // Plane5
    // EXP customize options
    for (let key of panel5) {
        let div = document.getElementById(key);
        let box2 = document.querySelector(`#${key} .box2`);
        // setting
        let rare = div.querySelector(".rare").selectedIndex;    // 0~6
        let sex = div.querySelector(".sex").selectedIndex;      // 0~1 女:男
        let cc = div.querySelector(".cc").selectedIndex;        // 0~2
        let lv = div.querySelector('.lv').value * 1;            // 0~99
        let cbonus = div.querySelector(".cbonus").checked ? 1 : 0;

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
        } else if (lv <= 0) {
            lv = div.querySelector('.lv').value = 1;
        }
        div.querySelector('.lv').max = maxLevel[cc][rare];

        // variable
        let ccexp = [0, 1].includes(rare) ? 5 : [7, 20, 50][cc];
        let exp = customizeConfig[rare][sex];
        if (box2.title) { exp = box2.title * 1; }

        exp += cbonus * customizeConfig[rare][2];
        exp += (lv - 1) * ccexp;
        exp = (exp * r).toFixed(1).replace(/\.0$/, "");

        box2.innerHTML = exp;
    }
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
    for (let div of document.querySelectorAll('.training[id]')) {
        let freeExp = div.querySelector(".freeExp");
        let addExp = freeExp ?
            freeExp.value :
            div.querySelector(".box2").innerHTML;
        addExp = Math.floor(addExp * 1 * (div.querySelector('.count').value * 1));

        if (addExp || (freeExp && freeExp.value > 0)) {
            sumAdditionalEXP += addExp;
            // set UI classname
            div.classList.add("keep");
        } else {
            div.classList.remove("keep");
        }
    }


    if (sumEXP >= 0) {
        document.getElementById("remainingEXP").innerHTML = sumEXP - sumAdditionalEXP;
    } else {
        document.getElementById("remainingEXP").innerHTML = "-";
    }

    /*
    if (sumAdditionalEXP > 0) {
        document.getElementById("addEXP").innerHTML = sumAdditionalEXP;
    } else {
        document.getElementById("addEXP").innerHTML = "-";
    }//*/

    if (sumEXP >= 0) {
        let rare = document.getElementById("selectRarity");
        rare = rare.options[rare.selectedIndex].label;

        document.getElementById("inputInformation").innerHTML =
            `${rare}<br>レベル：${currentLevel}(${getNext()})→${currentTargetLevel}`;
    } else {
        document.getElementById("inputInformation").innerHTML = "-";
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
let getExpData = () => {
    let obj = {};

    // get inputs
    let selectors = ["#boxtitle", '#selectRarity', '#selectCurrentLevel', '#inputNext', '#selectTargetLevel',
        '#checkSariette', '#Panel1', '#Panel2', '#Panel3', '#Panel4', '#Panel5'];
    for (let key of panel4) { selectors.push(`#${key} .box1`) }
    for (let div of document.querySelectorAll('.training[id]')) {
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
        obj[key] = value;
    }
    return obj;
}
let setExpData = (data) => {
    if (!data) { return; }

    // set data to UI
    document.getElementById("checkSariette").checked = data["#checkSariette"] || false;
    document.getElementById("selectRarity").selectedIndex = data["#selectRarity"] || 0; setMaxLevel();
    document.getElementById("selectCurrentLevel").selectedIndex = data["#selectCurrentLevel"] || 0; setExpLimit();
    document.getElementById("selectTargetLevel").selectedIndex = data["#selectTargetLevel"] || 0;
    document.getElementById("inputNext").value = data["#inputNext"] || 0;

    let keys = ["#checkSariette", "#selectRarity", "#selectCurrentLevel", "#inputNext", "#selectTargetLevel"];
    for (let key of Object.keys(data)) {
        if (keys.includes(key)) { continue; };
        let value = data[key];
        if (typeof (value) == 'undefined') { continue; }

        let div = document.querySelector(key);
        if (!div) { continue; }
        else if (div.tagName == 'DIV') { div.innerHTML = value; }
        else if (div.tagName == 'SELECT') { div.selectedIndex = value; }
        else if (div.type == 'checkbox') { div.checked = value; }
        else if (div.type == 'number') { div.value = value; }
    }
}
let resetExpData = () => {
    // reset input
    // document.getElementById("checkSariette").checked = false;
    setLevelRange(1, 1, 0);

    // reset box title
    {
        let div = document.querySelector("#boxtitle");
        div.innerHTML = div.title;
        for (let key of panel4) {
            div = document.querySelector(`#${key} .box1`);
            div.innerHTML = div.title;
        }
    }

    // reset Panel
    let selectors = ['#Panel1', '#Panel2', '#Panel3', '#Panel4', '#Panel5'];
    for (let div of document.querySelectorAll('.training[id]')) {
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
        if (!div || div.disabled) { continue; }

        if (div.tagName == 'SELECT') { div.selectedIndex = 0; }
        else if (div.type == 'checkbox') { div.checked = false; }
        else if (div.type == 'number') { div.value = div.min || 0; }
    }

    updateUI()
    calc();
}

let saveExpData = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
}
let loadExpData = (key) => {
    let data = {};
    try { data = JSON.parse(localStorage.getItem(key)) } catch { }
    return data;
}
let deleteExpData = (key) => {
    localStorage.removeItem(key);
}
let listExpData = () => {
    let keys = Object.keys(localStorage).filter((key) => key.startsWith('AigisToolsEXP')).sort();
    return keys;
}
let clearExpData = (key) => {
    let keys = Object.keys(localStorage).filter((key) => key.startsWith('AigisToolsEXP'));
    for (let key of keys) {
        localStorage.removeItem(key);
    }
}
let checkExpData = () => {
    let keys = listExpData();
    for (let _key of keys) {
        let time = parseInt(_key.substring(13)) || 0;
        let key = `AigisToolsEXP${time}`;
        if (_key != key) {
            let data = loadExpData(_key);
            saveExpData(key, data);
            deleteExpData(_key);
        }
    }
    return;
}


let isMobile = () => {
    let u = navigator.userAgent;
    let isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; //android终端
    let isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/); //ios终端
    return isAndroid || isiOS;
}