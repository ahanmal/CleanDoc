const distance = require('jaro-winkler');
const randomColor = require('randomcolor');
const { agnes } = require('ml-hclust');
import permutations from 'just-permutations';

import { equalityScore } from './diff';

const colors =
    ["7543d9","736762","db7c4d",
     "947363","3e8db5","decffc",
     "bfe3f5","6e7d51","aad9f0","aadaf2"];

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function splitTypeString(typeString) {
    let splitTypes = typeString.split(' -> ');
    let typesList = [];
    let currentFuncArgument = '';
    for (let type of splitTypes) {
        if (type.includes('(')) {
            currentFuncArgument = currentFuncArgument + type;
        } else if (type.includes(')')) {
            currentFuncArgument = currentFuncArgument + ' -> ' + type;
            typesList.push(currentFuncArgument);
            currentFuncArgument = '';
        } else {
            if (currentFuncArgument == '') {
                typesList.push(type);
            } else {
                currentFuncArgument = currentFuncArgument + ' -> ' + type;
            }
        }
    }
    return typesList;
}

function getRelatedFunctionsFromDesc(functionDOMDesc) {
    const pageHref = document.location.href;
    let relatedFuncs = [];
    for (let e of functionDOMDesc.getElementsByTagName('a')) {
        let split = e.href.split('#VAL');
        if (split[0] != pageHref) {
            continue;
        }
        relatedFuncs.push(split[1]);
    }
    return relatedFuncs;
}

function getFunctionSectionFromElement(element) {
    while (element) {
        if (element.tagName == 'H2') {
            return element.textContent;
        }
        element = element.previousElementSibling;
    }
    return null;
}

function getFunctionAttributes(element) {
    let attributeEls = element.getElementsByClassName('info-attributes');
    if (!attributeEls) {
        return [];
    }
    return attributeEls;
}

export function parseFunctionList() {
    let functions = {};
    let maxTypeSize = 0;
    let sectionColors = {};
    let colorIndex = 0;

    for (let element of document.body.getElementsByClassName("info")) {

        if (element.classList.length > 1
            || !element.previousSibling.hasChildNodes()) {
            continue;
        }

        let preSibling = element.previousElementSibling;
        let fullName = preSibling.getElementsByTagName("span")[0].textContent;

        let f = {};
        f["name"] = fullName.split('val ')[1];
        f["typeString"] = preSibling.getElementsByClassName("type")[0]
                                    .textContent;
        f['sectionName'] = getFunctionSectionFromElement(element) ?? 'Base';
        f['typeList'] = splitTypeString(f['typeString']);
        f["desc"] = element.getElementsByClassName("info-desc")[0];
        f['relatedFuncs'] = getRelatedFunctionsFromDesc(f['desc']);
        f['attributes'] = getFunctionAttributes(element);

        if (!(f['sectionName'] in sectionColors)) {
            sectionColors[f['sectionName']] = colors[colorIndex];
            colorIndex++;
        }
        f['color'] = sectionColors[f['sectionName']];
        let backgroundRGB = hexToRgb(f['color']);
        let textColor =
            ((backgroundRGB.r * 0.299 +
              backgroundRGB.g * 0.587 +
              backgroundRGB.b * 0.114) > 186) ? "black" : "white";
        f['sectionTextColor'] = textColor;

        functions[f['name']] = f;
        maxTypeSize = Math.max(maxTypeSize, f['typeList'].length);

    }
    let sortedFuncNameList = Object.keys(functions).sort();
    return {
        functions: functions,
        maxTypeSize: maxTypeSize,
        sectionColors: sectionColors,
        sortedNames: sortedFuncNameList
    };
}

function calcFunctionSimilarity(f1, f2) {
    let nameDist = distance(f1['name'], f2['name']);
    let typeDist = distance(f1['typeString'], f2['typeString']);
    // let relationBump = f1['relatedFuncs'].includes(f1['name']);
    return 1 - nameDist;
}

function buildDistanceMatrix(functionObj) {
    let arrLength = functionObj.sortedNames.length;
    var distMatrix = new Array(arrLength);
    for (let i = 0; i < arrLength; i++) {
        distMatrix[i] = new Array(arrLength);
    }

    for (var i = 0; i < arrLength; i++) {
        let iFunc = functionObj.functions[functionObj.sortedNames[i]];
        for (let j = 0; j < arrLength; j++) {
            let jFunc = functionObj.functions[functionObj.sortedNames[j]];
            distMatrix[i][j] = calcFunctionSimilarity(iFunc, jFunc);
        }
    }

    return distMatrix;
}

function findBaseInGroup(group) {
    let bestBase = group[0];
    let bestScore = 0;
    group.forEach((curr) => {
        let scoreSum = group.reduce((acc, el) => {
            return acc + equalityScore(curr.name, el.name);
        }, 0);
        console.log(curr.name + ' : ' + scoreSum);
        if (scoreSum >= bestScore) {
            bestBase = curr;
            bestScore = scoreSum;
        }
    });
    return bestBase;
}

function sortGroupByRendering(group) {
    group.forEach((curr) => {
        let scoreSum = group.reduce((acc, el) => {
            return acc + equalityScore(curr.name, el.name);
        }, 0);
        curr.groupScore = scoreSum;
    });
    group.sort((a, b) => a.groupScore - b.groupScore);

    return group;
}

export function buildCluster(functionObj) {
    let distMatrix = buildDistanceMatrix(functionObj);
    const c = agnes(distMatrix, {
        isDistanceMatrix: true,
    });

    let cutValueStr = document.getElementById("cutRange").value;
    let cutFactor = parseInt(cutValueStr) / 100.0;

    let cuts = c.cut(c.height * cutFactor);

    let groups = [];
    cuts.forEach((cluster) => {
        let group = [];
        cluster.indices().forEach(index => {
            let funName = functionObj.sortedNames[index];
            let fun = functionObj.functions[funName];
            group.push(fun);
        });
        group = sortGroupByRendering(group);
        groups.push(group);
    });

    functionObj.grouped = groups;
    return functionObj;
}
