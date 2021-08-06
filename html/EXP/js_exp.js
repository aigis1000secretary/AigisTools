var currentRarity, currentLevel, currentNext, currentTargetLevel;
var sumEXP;
var limitLevel = new Array();

var expTable = new Array();

// var scan = getCSVFile();
// function getCSVFile() {
//     var xhr = new XMLHttpRequest();
//     xhr.open("get", "./EXP/nextEXP.js", true);
//     xhr.send(null);
//     return xhr;
// }

function changeSelectRarity() {
    checkEXPTable();

    document.form.selectCurrentLevel.selectedIndex = 0;
    document.form.selectTargetLevel.selectedIndex = 0;

    getRarity();
    getLevel();
    document.form.selectCurrentLevel.options.length = limitLevel[currentRarity];
    document.form.selectTargetLevel.options.length = limitLevel[currentRarity];
    for (i = 0; i < limitLevel[currentRarity]; i++) {
        document.form.selectCurrentLevel.options[i].text = (i + 1);
        document.form.selectTargetLevel.options[i].text = (i + 1);
    }

    setMaxLimit(currentRarity, currentLevel);
    run();
}

function changeSelectCurrentLevel() {
    checkEXPTable();
    getRarity();
    getLevel();
    if (document.form.selectTargetLevel.selectedIndex < document.form.selectCurrentLevel.selectedIndex) {
        document.form.selectTargetLevel.selectedIndex = document.form.selectCurrentLevel.selectedIndex;
    }
    setMaxLimit(currentRarity, currentLevel);

    run();
}

function setMaxLimit(r, l) {
    checkEXPTable();
    document.form.inputNext.value = expTable[l][r + 1];
    document.form.inputNext.min = 1;
    document.form.inputNext.max = expTable[l][r + 1];
}

function setCurrentMaxLimit() {
    checkEXPTable();
    document.form.inputNext.value = expTable[getLevel()][getRarity() + 1];
    run();
}

function setNext(v) {
    checkEXPTable();
    if (v > expTable[getLevel()][getRarity() + 1]) {
        document.form.inputNext.value = expTable[getLevel()][getRarity() + 1];
    } else {
        document.form.inputNext.value = v;
    }
    run();
}

function setLevelRange(l, t, r = 0) {
    if (r != 0) {
        document.form.selectRarity.selectedIndex = r;
        changeSelectRarity();
    }

    checkEXPTable();
    getRarity();
    document.form.selectCurrentLevel.selectedIndex = l - 1;
    changeSelectCurrentLevel(l - 1);
    if (limitLevel[currentRarity] < t) {
        document.form.selectTargetLevel.selectedIndex = limitLevel[currentRarity] - 1;
    } else {
        document.form.selectTargetLevel.selectedIndex = t - 1;
    }

    run();
}

function getRarity() {
    currentRarity = document.form.selectRarity.selectedIndex;
    return currentRarity;
}

function getLevel() {
    currentLevel = document.form.selectCurrentLevel.selectedIndex + 1;
    return currentLevel;
}

function getNext() {
    currentNext = parseInt(document.form.inputNext.value);
    return currentNext;
}

function getTarget() {
    currentTargetLevel = document.form.selectTargetLevel.selectedIndex + 1;
    return currentTargetLevel;
}

function checkEXPTable() {
    if (expTable.length <= 1) {
        var tempArray = scan.responseText.split("\n");
        for (var i = 0; i < tempArray.length; i++) {
            expTable[i] = tempArray[i].split(",");
        }
    }
}

var tmrExecte;
var blnExecute;
var intTmrInterval = 75;

function countUp() {
    if (parseInt(document.form.inputNext.value) < expTable[currentLevel][currentRarity + 1]) {
        document.form.inputNext.value = parseInt(document.form.inputNext.value) + 1;
        run();
    }
}

function countDown() {
    if (parseInt(document.form.inputNext.value) > 1) {
        document.form.inputNext.value = parseInt(document.form.inputNext.value) - 1;
        run();
    }
}

function startCountUp() {
    checkEXPTable();
    getLevel();

    clearInterval(tmrExecte);
    blnExecute = true;

    countUp();

    tmrExecte = setInterval(countUp, intTmrInterval);
}

function startCountDown() {
    checkEXPTable();
    getLevel();

    clearInterval(tmrExecte);
    blnExecute = true;

    countDown();

    tmrExecte = setInterval(countDown, intTmrInterval);
}

function stop() {
    clearInterval(tmrExecte);
    blnExecute = false;
}

function run() {
    checkEXPTable();

    getRarity();
    getLevel();
    sumEXP = getNext();
    getTarget();

    for (i = currentLevel + 1; i <= currentTargetLevel - 1; i++) {
        sumEXP = sumEXP + parseInt(expTable[i][currentRarity + 1]);
    }
    if (currentLevel < currentTargetLevel) {
        document.getElementById("necessaryEXP").innerHTML = sumEXP;
    } else {
        sumEXP = -1;
        document.getElementById("necessaryEXP").innerHTML = "-";
    }

    refreshRemainingEXP();
}

var intTmrInterval2 = 150;
function countUpWArmor() {
    document.form.inputWArmor.value = parseInt(document.form.inputWArmor.value) + 1;
    refreshRemainingEXP();
}

function countDownWArmor() {
    if (parseInt(document.form.inputWArmor.value) > 0) {
        document.form.inputWArmor.value = parseInt(document.form.inputWArmor.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpWArmor() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpWArmor();

    tmrExecte = setInterval(countUpWArmor, intTmrInterval2);
}

function startCountDownWArmor() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownWArmor();

    tmrExecte = setInterval(countDownWArmor, intTmrInterval2);
}

function countUpBArmor() {
    document.form.inputBArmor.value = parseInt(document.form.inputBArmor.value) + 1;
    refreshRemainingEXP();
}

function countDownBArmor() {
    if (parseInt(document.form.inputBArmor.value) > 0) {
        document.form.inputBArmor.value = parseInt(document.form.inputBArmor.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpBArmor() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpBArmor();

    tmrExecte = setInterval(countUpBArmor, intTmrInterval2);
}

function startCountDownBArmor() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownBArmor();

    tmrExecte = setInterval(countDownBArmor, intTmrInterval2);
}

function countUpAmour() {
    document.form.inputAmour.value = parseInt(document.form.inputAmour.value) + 1;
    refreshRemainingEXP();
}

function countDownAmour() {
    if (parseInt(document.form.inputAmour.value) > 0) {
        document.form.inputAmour.value = parseInt(document.form.inputAmour.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpAmour() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpAmour();

    tmrExecte = setInterval(countUpAmour, intTmrInterval2);
}

function startCountDownAmour() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownAmour();

    tmrExecte = setInterval(countDownAmour, intTmrInterval2);
}

function countUpAlegria() {
    document.form.inputAlegria.value = parseInt(document.form.inputAlegria.value) + 1;
    refreshRemainingEXP();
}

function countDownAlegria() {
    if (parseInt(document.form.inputAlegria.value) > 0) {
        document.form.inputAlegria.value = parseInt(document.form.inputAlegria.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpAlegria() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpAlegria();

    tmrExecte = setInterval(countUpAlegria, intTmrInterval2);
}

function startCountDownAlegria() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownAlegria();

    tmrExecte = setInterval(countDownAlegria, intTmrInterval2);
}

function countUpLiebe() {
    document.form.inputLiebe.value = parseInt(document.form.inputLiebe.value) + 1;
    refreshRemainingEXP();
}

function countDownLiebe() {
    if (parseInt(document.form.inputLiebe.value) > 0) {
        document.form.inputLiebe.value = parseInt(document.form.inputLiebe.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpLiebe() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpLiebe();

    tmrExecte = setInterval(countUpLiebe, intTmrInterval2);
}

function startCountDownLiebe() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownLiebe();

    tmrExecte = setInterval(countDownLiebe, intTmrInterval2);
}

function countUpFreude() {
    document.form.inputFreude.value = parseInt(document.form.inputFreude.value) + 1;
    refreshRemainingEXP();
}

function countDownFreude() {
    if (parseInt(document.form.inputFreude.value) > 0) {
        document.form.inputFreude.value = parseInt(document.form.inputFreude.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpFreude() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpFreude();

    tmrExecte = setInterval(countUpFreude, intTmrInterval2);
}

function startCountDownFreude() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownFreude();

    tmrExecte = setInterval(countDownFreude, intTmrInterval2);
}

function countUpFarah() {
    document.form.inputFarah.value = parseInt(document.form.inputFarah.value) + 1;
    refreshRemainingEXP();
}

function countDownFarah() {
    if (parseInt(document.form.inputFarah.value) > 0) {
        document.form.inputFarah.value = parseInt(document.form.inputFarah.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpFarah() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpFarah();

    tmrExecte = setInterval(countUpFarah, intTmrInterval2);
}

function startCountDownFarah() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownFarah();

    tmrExecte = setInterval(countDownFarah, intTmrInterval2);
}

function countUpEmperor01() {
    document.form.inputEmperor01.value = parseInt(document.form.inputEmperor01.value) + 1;
    refreshRemainingEXP();
}

function countDownEmperor01() {
    if (parseInt(document.form.inputEmperor01.value) > 0) {
        document.form.inputEmperor01.value = parseInt(document.form.inputEmperor01.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpEmperor01() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpEmperor01();

    tmrExecte = setInterval(countUpEmperor01, intTmrInterval2);
}

function startCountDownEmperor01() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownEmperor01();

    tmrExecte = setInterval(countDownEmperor01, intTmrInterval2);
}

function countUpEmperor17() {
    document.form.inputEmperor17.value = parseInt(document.form.inputEmperor17.value) + 1;
    refreshRemainingEXP();
}

function countDownEmperor17() {
    if (parseInt(document.form.inputEmperor17.value) > 0) {
        document.form.inputEmperor17.value = parseInt(document.form.inputEmperor17.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpEmperor17() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpEmperor17();

    tmrExecte = setInterval(countUpEmperor17, intTmrInterval2);
}

function startCountDownEmperor17() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownEmperor17();

    tmrExecte = setInterval(countDownEmperor17, intTmrInterval2);
}

function countUpEmperor20() {
    document.form.inputEmperor20.value = parseInt(document.form.inputEmperor20.value) + 1;
    refreshRemainingEXP();
}

function countDownEmperor20() {
    if (parseInt(document.form.inputEmperor20.value) > 0) {
        document.form.inputEmperor20.value = parseInt(document.form.inputEmperor20.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpEmperor20() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpEmperor20();

    tmrExecte = setInterval(countUpEmperor20, intTmrInterval2);
}

function startCountDownEmperor20() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownEmperor20();

    tmrExecte = setInterval(countDownEmperor20, intTmrInterval2);
}

function countUpB01() {
    document.form.inputB01.value = parseInt(document.form.inputB01.value) + 1;
    refreshRemainingEXP();
}

function countDownB01() {
    if (parseInt(document.form.inputB01.value) > 0) {
        document.form.inputB01.value = parseInt(document.form.inputB01.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpB01() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpB01();

    tmrExecte = setInterval(countUpB01, intTmrInterval2);
}

function startCountDownB01() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownB01();

    tmrExecte = setInterval(countDownB01, intTmrInterval2);
}

function countUpB02() {
    document.form.inputB02.value = parseInt(document.form.inputB02.value) + 1;
    refreshRemainingEXP();
}

function countDownB02() {
    if (parseInt(document.form.inputB02.value) > 0) {
        document.form.inputB02.value = parseInt(document.form.inputB02.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpB02() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpB02();

    tmrExecte = setInterval(countUpB02, intTmrInterval2);
}

function startCountDownB02() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownB02();

    tmrExecte = setInterval(countDownB02, intTmrInterval2);
}

function countUpB03() {
    document.form.inputB03.value = parseInt(document.form.inputB03.value) + 1;
    refreshRemainingEXP();
}

function countDownB03() {
    if (parseInt(document.form.inputB03.value) > 0) {
        document.form.inputB03.value = parseInt(document.form.inputB03.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpB03() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpB03();

    tmrExecte = setInterval(countUpB03, intTmrInterval2);
}

function startCountDownB03() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownB03();

    tmrExecte = setInterval(countDownB03, intTmrInterval2);
}

function countUpB04() {
    document.form.inputB04.value = parseInt(document.form.inputB04.value) + 1;
    refreshRemainingEXP();
}

function countDownB04() {
    if (parseInt(document.form.inputB04.value) > 0) {
        document.form.inputB04.value = parseInt(document.form.inputB04.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpB04() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpB04();

    tmrExecte = setInterval(countUpB04, intTmrInterval2);
}

function startCountDownB04() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownB04();

    tmrExecte = setInterval(countDownB04, intTmrInterval2);
}

function countUpB05() {
    document.form.inputB05.value = parseInt(document.form.inputB05.value) + 1;
    refreshRemainingEXP();
}

function countDownB05() {
    if (parseInt(document.form.inputB05.value) > 0) {
        document.form.inputB05.value = parseInt(document.form.inputB05.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpB05() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpB05();

    tmrExecte = setInterval(countUpB05, intTmrInterval2);
}

function startCountDownB05() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownB05();

    tmrExecte = setInterval(countDownB05, intTmrInterval2);
}

function countUpFree01() {
    document.form.inputFree01.value = parseInt(document.form.inputFree01.value) + 1;
    refreshRemainingEXP();
}

function countDownFree01() {
    if (parseInt(document.form.inputFree01.value) > 0) {
        document.form.inputFree01.value = parseInt(document.form.inputFree01.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpFree01() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpFree01();

    tmrExecte = setInterval(countUpFree01, intTmrInterval2);
}

function startCountDownFree01() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownFree01();

    tmrExecte = setInterval(countDownFree01, intTmrInterval2);
}

function countUpFree02() {
    document.form.inputFree02.value = parseInt(document.form.inputFree02.value) + 1;
    refreshRemainingEXP();
}

function countDownFree02() {
    if (parseInt(document.form.inputFree02.value) > 0) {
        document.form.inputFree02.value = parseInt(document.form.inputFree02.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpFree02() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpFree02();

    tmrExecte = setInterval(countUpFree02, intTmrInterval2);
}

function startCountDownFree02() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownFree02();

    tmrExecte = setInterval(countDownFree02, intTmrInterval2);
}

function countUpFree03() {
    document.form.inputFree03.value = parseInt(document.form.inputFree03.value) + 1;
    refreshRemainingEXP();
}

function countDownFree03() {
    if (parseInt(document.form.inputFree03.value) > 0) {
        document.form.inputFree03.value = parseInt(document.form.inputFree03.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpFree03() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpFree03();

    tmrExecte = setInterval(countUpFree03, intTmrInterval2);
}

function startCountDownFree03() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownFree03();

    tmrExecte = setInterval(countDownFree03, intTmrInterval2);
}

function countUpFree04() {
    document.form.inputFree04.value = parseInt(document.form.inputFree04.value) + 1;
    refreshRemainingEXP();
}

function countDownFree04() {
    if (parseInt(document.form.inputFree04.value) > 0) {
        document.form.inputFree04.value = parseInt(document.form.inputFree04.value) - 1;
        refreshRemainingEXP();
    }
}

function startCountUpFree04() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countUpFree04();

    tmrExecte = setInterval(countUpFree04, intTmrInterval2);
}

function startCountDownFree04() {
    clearInterval(tmrExecte);
    blnExecute = true;

    countDownFree04();

    tmrExecte = setInterval(countDownFree04, intTmrInterval2);
}

function switchSariette() {
    if (document.form.checkSariette.checked) {
        document.getElementById("expWArmor").innerHTML = "8800";
        document.getElementById("expBArmor").innerHTML = "44000";
        document.getElementById("expAmour").innerHTML = "4400";
        document.getElementById("expAlegria").innerHTML = "19800";
        document.getElementById("expLiebe").innerHTML = "20900";
        document.getElementById("expFreude").innerHTML = "20900";
        document.getElementById("expFarah").innerHTML = "22000";
        document.getElementById("expEmperor01").innerHTML = "17600";
        document.getElementById("expEmperor17").innerHTML = "20416";
        document.getElementById("expEmperor20").innerHTML = "20944";
        document.getElementById("expB01").innerHTML = "258.5";
        document.getElementById("expB02").innerHTML = "291.5";
        document.getElementById("expB03").innerHTML = "258.5";
        document.getElementById("expB04").innerHTML = "291.5";
        document.getElementById("expB05").innerHTML = "242";
        document.getElementById("expB06").innerHTML = "275";
    } else {
        document.getElementById("expWArmor").innerHTML = "8000";
        document.getElementById("expBArmor").innerHTML = "40000";
        document.getElementById("expAmour").innerHTML = "4000";
        document.getElementById("expAlegria").innerHTML = "18000";
        document.getElementById("expLiebe").innerHTML = "19000";
        document.getElementById("expFreude").innerHTML = "19000";
        document.getElementById("expFarah").innerHTML = "20000";
        document.getElementById("expEmperor01").innerHTML = "16000";
        document.getElementById("expEmperor17").innerHTML = "18560";
        document.getElementById("expEmperor20").innerHTML = "19040";
        document.getElementById("expB01").innerHTML = "235";
        document.getElementById("expB02").innerHTML = "265";
        document.getElementById("expB03").innerHTML = "235";
        document.getElementById("expB04").innerHTML = "265";
        document.getElementById("expB05").innerHTML = "220";
        document.getElementById("expB06").innerHTML = "250";
    }


    refreshRemainingEXP();
}

var remainingEXP;
function refreshRemainingEXP() {
    function inputFree(e) {
        try {
            let v = eval(e.value);
            e.value = (!!v) ? parseInt(v) : 0;
        } catch (err) {
            e.value = 0;
        }
    }
    inputFree(document.form.inputFreeEXP01);
    inputFree(document.form.inputFreeEXP02);
    inputFree(document.form.inputFreeEXP03);
    inputFree(document.form.inputFreeEXP04);

    var sumAdditionalEXP = 0;
    sumAdditionalEXP = sumAdditionalEXP + 8000 * parseInt(document.form.inputWArmor.value);
    sumAdditionalEXP = sumAdditionalEXP + 40000 * parseInt(document.form.inputBArmor.value);
    sumAdditionalEXP = sumAdditionalEXP + 4000 * parseInt(document.form.inputAmour.value);
    sumAdditionalEXP = sumAdditionalEXP + 18000 * parseInt(document.form.inputAlegria.value);
    sumAdditionalEXP = sumAdditionalEXP + 19000 * parseInt(document.form.inputLiebe.value);
    sumAdditionalEXP = sumAdditionalEXP + 19000 * parseInt(document.form.inputFreude.value);
    sumAdditionalEXP = sumAdditionalEXP + 20000 * parseInt(document.form.inputFarah.value);
    sumAdditionalEXP = sumAdditionalEXP + 16000 * parseInt(document.form.inputEmperor01.value);
    sumAdditionalEXP = sumAdditionalEXP + 18560 * parseInt(document.form.inputEmperor17.value);
    sumAdditionalEXP = sumAdditionalEXP + 19040 * parseInt(document.form.inputEmperor20.value);
    sumAdditionalEXP = sumAdditionalEXP + 235 * parseInt(document.form.inputB01.value);
    sumAdditionalEXP = sumAdditionalEXP + 265 * parseInt(document.form.inputB02.value);
    sumAdditionalEXP = sumAdditionalEXP + 235 * parseInt(document.form.inputB03.value);
    sumAdditionalEXP = sumAdditionalEXP + 265 * parseInt(document.form.inputB04.value);
    sumAdditionalEXP = sumAdditionalEXP + 220 * parseInt(document.form.inputB05.value);
    sumAdditionalEXP = sumAdditionalEXP + 250 * parseInt(document.form.inputB06.value);

    if (document.form.checkSariette.checked) {
        sumAdditionalEXP = Math.floor(sumAdditionalEXP * 1.1);
    }

    sumAdditionalEXP = sumAdditionalEXP + parseInt(document.form.inputFreeEXP01.value * document.form.inputFree01.value);
    sumAdditionalEXP = sumAdditionalEXP + parseInt(document.form.inputFreeEXP02.value * document.form.inputFree02.value);
    sumAdditionalEXP = sumAdditionalEXP + parseInt(document.form.inputFreeEXP03.value * document.form.inputFree03.value);
    sumAdditionalEXP = sumAdditionalEXP + parseInt(document.form.inputFreeEXP04.value * document.form.inputFree04.value);

    if (sumEXP >= 0) {
        document.getElementById("remainingEXP").innerHTML = sumEXP - sumAdditionalEXP;
    } else {
        document.getElementById("remainingEXP").innerHTML = "-";
    }

}

function init() {
    var tempArray = scan.responseText.split("\r\n");
    for (var i = 0; i < tempArray.length; i++) {
        expTable[i] = tempArray[i].split(",");
    }

    limitLevel = [30, 40, 55, 99, 99, 99, 99];

    document.form.selectRarity.selectedIndex = 0;
    changeSelectRarity();

    document.form.inputNext.value = 32;
    document.form.inputNext.min = 1;
    document.form.inputNext.max = 32;
}