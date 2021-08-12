
let maxLevel = [40, 50, 55, 99, 99, 99, 99];
let plane1Config = [
    ["expAmour", 2],
    ["expAlegria", 3],
    ["expPreseil", 3],
    ["expLiebe", 4],
    ["expFreude", 5],
    ["expFarah", 6]
];

// body onload method
let bodyOnload = () => {
    // init card box
    setMaxLevel();
    setExpLimit();

    // set button event
    for (let btn of document.getElementsByTagName("input")) {
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
        div.addEventListener("click", function (e) {
            div.innerHTML = prompt(`【自由欄${name[name.length - 1]}】`, div.innerHTML) || `【自由欄${name[name.length - 1]}】`;
        }, false);
    }
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
    document.getElementById("expEmperor01").querySelector(".box2").innerHTML = Math.floor(16000 * r);
    document.getElementById("expEmperor17").querySelector(".box2").innerHTML = Math.floor(18560 * r);
    document.getElementById("expEmperor20").querySelector(".box2").innerHTML = Math.floor(19040 * r);
    document.getElementById("expB01").querySelector(".box2").innerHTML = (235 * r).toFixed(1);
    document.getElementById("expB02").querySelector(".box2").innerHTML = (265 * r).toFixed(1);
    document.getElementById("expB03").querySelector(".box2").innerHTML = (220 * r).toFixed(1);
    document.getElementById("expB04").querySelector(".box2").innerHTML = (250 * r).toFixed(1);

    calc();
    // necessaryEXP
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
    let expNameList = [
        "expWArmor", "expBArmor",
        "expAmour", "expPreseil", "expAlegria", "expLiebe", "expFreude", "expFarah",
        "expEmperor01", "expEmperor17", "expEmperor20",
        "expB01", "expB02", "expB03", "expB04",
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