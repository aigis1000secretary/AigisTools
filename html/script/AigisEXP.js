
let maxLevel = [40, 50, 55, 99, 99, 99, 99];
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
            btn.addEventListener("change", function (e) {
                calc();
            }, false);

        }
    }

    // free exp
    for (let name of ["expFree01", "expFree02", "expFree03", "expFree04"]) {
        let div = document.getElementById(name).querySelector(".box1");
        div.style.cursor = "pointer";
        div.addEventListener("click", function (e) {
            div.innerHTML = prompt(`【自由欄${name[name.length - 1]}】`, div.innerHTML) || `【自由欄${name[name.length - 1]}】`;
        }, false);
    }

    // box title
    let div = document.getElementById("boxtitle");
    div.style.cursor = "pointer";
    div.addEventListener("click", function (e) {
        div.innerHTML = prompt(`名前入力`, div.innerHTML) || `育成計画`;
    }, false);

    calc();
}

// data api
let setRarity = (r) => {
    document.getElementById("selectRarity").selectedIndex = r;
    // update UI
    setMaxLevel()
    setExpLimit()
}
let setLevel = (l) => {
    document.getElementById("selectCurrentLevel").selectedIndex = l - 1;
    // update UI
    setExpLimit()
}
let setTargetLevel = (t) => {
    document.getElementById("selectTargetLevel").selectedIndex = t - 1;
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
    return parseInt(document.getElementById("inputNext").value);
}

// button event
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
let setLevelRange = (l, t, r = 0) => {
    setRarity(r);
    setLevel(l);
    setTargetLevel(t);

    calc();
    // necessaryEXP
}
let switchSariette = () => {
    let r = document.getElementById("checkSariette").checked ? 1.1 : 1.0

    document.getElementById("expWArmor").querySelector(".box2").innerHTML = Math.floor(8000 * r);
    document.getElementById("expBArmor").querySelector(".box2").innerHTML = Math.floor(40000 * r);
    document.getElementById("expAmour").querySelector(".box2").innerHTML = Math.floor(4000 * r);
    document.getElementById("expPreseil").querySelector(".box2").innerHTML = Math.floor(1750 * r);
    document.getElementById("expAlegria").querySelector(".box2").innerHTML = Math.floor(18000 * r);
    document.getElementById("expLiebe").querySelector(".box2").innerHTML = Math.floor(19000 * r);
    document.getElementById("expFreude").querySelector(".box2").innerHTML = Math.floor(19000 * r);
    document.getElementById("expFarah").querySelector(".box2").innerHTML = Math.floor(20000 * r);
    document.getElementById("expPresent").querySelector(".box2").innerHTML = Math.floor(18000 * r);
    document.getElementById("expPlacer").querySelector(".box2").innerHTML = Math.floor(18000 * r);
    document.getElementById("expEmperor01").querySelector(".box2").innerHTML = Math.floor(16000 * r);
    document.getElementById("expEmperor17").querySelector(".box2").innerHTML = Math.floor(18560 * r);
    document.getElementById("expEmperor20").querySelector(".box2").innerHTML = Math.floor(19040 * r);
    document.getElementById("expB01").querySelector(".box2").innerHTML = (235 * r).toFixed(1).replace(/\.0$/, "");
    document.getElementById("expB02").querySelector(".box2").innerHTML = (265 * r).toFixed(1).replace(/\.0$/, "");
    document.getElementById("expB03").querySelector(".box2").innerHTML = (220 * r).toFixed(1).replace(/\.0$/, "");
    document.getElementById("expB04").querySelector(".box2").innerHTML = (250 * r).toFixed(1).replace(/\.0$/, "");

    calc();
    // necessaryEXP
}

// html result to image
let openImage = function () {
    $(window).scrollTop(0);
    html2canvas(document.getElementById("expcalc")).then(function (canvas) {
        var image = new Image();
        image.src = canvas.toDataURL("image/png");
        window.open().document.write(`<img src="${image.src}" />`);
    });
}





// UI method
let setMaxLevel = () => {
    let r = getRarity();
    document.getElementById("selectCurrentLevel").options.length = maxLevel[r];
    document.getElementById("selectTargetLevel").options.length = maxLevel[r];
    for (i = 0; i < maxLevel[r]; i++) {
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

let calc = () => {
    // EXP customize options
    let expNameList = [
        "expC01", "expC02", "expC03", "expC04"
    ];
    let customizeConfig = [
        [0, 40, 10],     // 0
        [0, 70, 30],     // 1
        [150, 300, 50],     // 2
        [250, 750, 80],     // 3
        [250, 750, 90],     // 4
        [500, 1500, 100],     // 5
        [1000, 2000, 300],     // 6
    ];
    for (let name of expNameList) {
        let div = document.getElementById(name);
        // setting
        let rare = div.querySelector(".rare").selectedIndex;  // 0~6
        let sex = div.querySelector(".sex").selectedIndex;    // 0~1 女:男
        let cc = div.querySelector(".cc").selectedIndex;    // 0~2
        let lv = parseInt(div.querySelector('.lv').value); // 0~99
        let cbonus = div.querySelector(".cbonus").checked ? 1 : 0;
        // variable
        let ccexp = [0, 1].includes(rare) ? 5 : [7, 20, 50][cc];
        let r = document.getElementById("checkSariette").checked ? 1.1 : 1.0

        // check selected
        if ([0, 1].includes(rare)) {
            sex = div.querySelector(".sex").selectedIndex = 1;
            cc = div.querySelector(".cc").selectedIndex = 0;
        }
        if (lv > maxLevel[rare]) {
            rare = div.querySelector('.box1 input[type="number"]').value = maxLevel[rare];
        }

        let exp = customizeConfig[rare][sex]
        exp += cbonus * customizeConfig[rare][2];
        exp += (lv - 1) * ccexp;
        exp = (exp * r).toFixed(1).replace(/\.0$/, "");;

        div.querySelector(".box2").innerHTML = exp;
    }

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
        "expWArmor", "expBArmor",
        "expAmour", "expPreseil", "expAlegria", "expLiebe", "expFreude", "expFarah", "expPresent", "expPlacer",
        "expEmperor01", "expEmperor17", "expEmperor20",
        "expB01", "expB02", "expB03", "expB04",
        "expC01", "expC02", "expC03", "expC04"
    ];
    for (let name of expNameList) {
        let div = document.getElementById(name);

        let check = plane1Config.find(e => e[0] == name);
        if (check != null &&    // config defined
            check[1] != -1 &&   // not for all rare
            check[1] != currentRarity)  // not for this rare
        { continue; }

        sumAdditionalEXP +=
            parseInt(div.querySelector(".box2").innerHTML) *
            div.querySelector('.box3 input[type="number"]').value;
    }

    expNameList = ["expFree01", "expFree02", "expFree03", "expFree04"];
    for (let name of expNameList) {
        let div = document.getElementById(name);

        sumAdditionalEXP += parseInt(div.querySelector(".box2 input").value) *
            div.querySelector('.box3 input[type="number"]').value;
    }

    if (sumEXP >= 0) {
        document.getElementById("remainingEXP").innerHTML = sumEXP - sumAdditionalEXP;
    } else {
        document.getElementById("remainingEXP").innerHTML = "-";
    }
}