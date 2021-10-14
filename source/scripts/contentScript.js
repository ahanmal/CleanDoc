import { diff_match_patch } from 'diff-match-patch';
import { Graph, alg, json } from '@dagrejs/graphlib';
import '../styles/contentScript.scss';

const distance = require('jaro-winkler');
const randomColor = require('randomcolor');
const Diff = require('diff');
const NAME_PRE_SPACES = 10;

function removeAll(originalSet, toBeRemovedSet) {
    toBeRemovedSet.forEach(Set.prototype.delete, originalSet);
}

function addTypesToRow(typeList, row, maxTypeLength) {
    for (let i = 0; i < maxTypeLength; i++) {
        if (i < typeList.length) {
            addCodeColToRow(typeList[i], row);
            if (i < typeList.length - 1) {
                addCodeColToRow('->', row, 'typeSplitter');
            }
        } else {
            row.appendChild(document.createElement('td'));
            row.appendChild(document.createElement('td'));
        }
    }
}

function addCodeColToRow(code, row, className = '') {
    let tdEl = document.createElement('td');
    let codeEl = document.createElement('code');
    if (className) {
        tdEl.className = className;
    }
    codeEl.className = 'code';
    let text = document.createTextNode(code);
    codeEl.appendChild(text);
    tdEl.appendChild(codeEl);
    row.appendChild(tdEl);
    return codeEl;
}

function generateTooltipHtml(func) {

    let tdEl = document.createElement('td');

    if (func['attributes'].length > 0) {
        let outerDiv = document.createElement('div');
        outerDiv.className = 'tooltip';
        let innerDiv = document.createElement('div');
        innerDiv.className = 'tooltip-text';
        for (var i = 0; i < func['attributes'].length; i++) {
            innerDiv.appendChild(func['attributes'][i]);
        }
        outerDiv.appendChild(innerDiv);
        tdEl.appendChild(outerDiv);
    }

    return tdEl;
}

function buildBaseRow(base, maxTypeLength) {
    let baseRow = document.createElement("tr");
    baseRow.className = 'tr-base';

    let tdEl = document.createElement('td');
    tdEl.className = 'td-section';
    tdEl.style.backgroundColor = base['color'];
    tdEl.append(base['sectionName']);
    baseRow.appendChild(tdEl);

    addCodeColToRow('\xA0'.repeat(NAME_PRE_SPACES) + base['name'], baseRow, 'funName');
    addTypesToRow(base['typeList'], baseRow, maxTypeLength)

    baseRow.appendChild(generateTooltipHtml(base));

    tdEl = document.createElement('td');
    tdEl.className = 'td-desc';
    tdEl.append(base['desc']);
    baseRow.appendChild(tdEl);


    return baseRow;
}

function buildCompRow(base, comp, maxTypeLength) {
    let compRow = document.createElement("tr");


    let tdEl = document.createElement('td');
    tdEl.className = 'td-section';
    tdEl.style.backgroundColor = comp['color'];
    tdEl.append(comp['sectionName']);
    compRow.appendChild(tdEl);

    let nameCodeEl = addCodeColToRow('', compRow, 'funName');
    var dmp = new diff_match_patch();
    var nameDiff = dmp.diff_main(base['name'], comp['name'])
    dmp.diff_cleanupSemantic(nameDiff);
    nameDiff.forEach((part, i) => {
        let span = document.createElement('span');
        span.style.color = part[0] == 1 ? 'black' : 'grey';
        if (i == 0) {
            let preSpaceCount = part[0] == 1 ? NAME_PRE_SPACES - part[1].length : NAME_PRE_SPACES;
            let printPart = part[0] != -1 ? part[1] : '';
            span.appendChild(document.createTextNode('\xA0'.repeat(preSpaceCount) + printPart));
        } else if (part[0] != -1) {
            span.appendChild(document.createTextNode(part[1]));
        }
        nameCodeEl.appendChild(span);
    });

    addTypesToRow(comp['typeList'], compRow, maxTypeLength)

    let descTdEl = document.createElement('td');
    descTdEl.className = 'td-desc'
    let descChildNodes = Array.from(comp['desc'].children[0].childNodes);
    let baseDescChildNodes = Array.from(base['desc'].children[0].childNodes);

    if (descChildNodes.length == baseDescChildNodes.length) {
        for (let i = 0; i < descChildNodes.length; i++) {
            let descChild = descChildNodes[i];
            if (descChild.nodeType == 1) { // If it's not text
                let codeBlock = document.createElement('code');
                baseDescChildNodes[i].className = `desc-code-${base['name']}-${i}`;
                codeBlock.className = `desc-code-${base['name']}-${i}`;
                let descDiff = Diff.diffChars(baseDescChildNodes[i].textContent, descChild.textContent);
                descDiff.forEach((part) => {
                    if (part.removed) {
                        return;
                    }
                    const color = part.added ? 'black' : 'grey';
                    let span = document.createElement('span');
                    span.style.color = color;
                    span.appendChild(document
                        .createTextNode(part.value));
                    codeBlock.appendChild(span);
                });
                descTdEl.appendChild(codeBlock);
            } else if (descChild.nodeType == 3) { // If it's text
                let descDiff = Diff.diffWords(baseDescChildNodes[i].textContent, descChild.textContent);
                descDiff.forEach((part) => {
                    if (part.removed) {
                        return;
                    }
                    const color = part.added ? 'black' : 'grey';
                    let span = document.createElement('span');
                    span.style.color = color;
                    span.appendChild(document
                        .createTextNode(part.value));
                    descTdEl.appendChild(span);
                });
            }
        }
    } else {
        descTdEl.appendChild(comp['desc']);
        console.log(descTdEl);
    }

    compRow.appendChild(generateTooltipHtml(comp));
    compRow.appendChild(descTdEl);

    return compRow;
}

function renderFunctionsAgainstBase(base, functions, tblBody, maxTypeSize) {
    tblBody.append(buildBaseRow(base, maxTypeSize));

    for (let f of functions) {
        let row = buildCompRow(base, f, maxTypeSize);
        tblBody.append(row);
    }
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
    let attrList = [];
    let attributeEls = element.getElementsByClassName('info-attributes');
    if (!attributeEls) {
        return [];
    }
    return attributeEls;
}

function renderCleanDoc() {
    let functions = {};
    var g = new Graph();
    let maxTypeSize = 0;
    let sectionColors = {};

    for (let element of document.body.getElementsByClassName("info")) {

        if (element.classList.length > 1 || !element.previousSibling.hasChildNodes()) {
            continue;
        }

        let preSibling = element.previousElementSibling;
        let fullName = preSibling.getElementsByTagName("span")[0].textContent;

        let f = {};
        f["name"] = fullName.split('val ')[1];
        f["typeString"] = preSibling.getElementsByClassName("type")[0].textContent;
        f['sectionName'] = getFunctionSectionFromElement(element) ?? 'Base';
        f['typeList'] = splitTypeString(f['typeString']);
        f["desc"] = element.getElementsByClassName("info-desc")[0];
        f['relatedFuncs'] = getRelatedFunctionsFromDesc(f['desc']);
        f['attributes'] = getFunctionAttributes(element);

        if (!(f['sectionName'] in sectionColors)) {
            sectionColors[f['sectionName']] = randomColor();
        }
        f['color'] = sectionColors[f['sectionName']];

        functions[f['name']] = f;
        g.setNode(f['name']);
        for (let r of f['relatedFuncs']) {
            g.setNode(r);
            g.setEdge(f['name'], r)
        }
        maxTypeSize = Math.max(maxTypeSize, f['typeList'].length);
    }

    let bases = ['make', 'init', 'length', 'get', 'concat', 'equal', 'compare', 'contains', 'sub',
                 'split_on_char', 'map', 'trim', 'escaped', 'uppercase_ascii', 'capitalize_ascii',
                 'iter', 'index_from', 'to_seq', 'create', 'set', 'blit', 'copy', 'fill'];


    let functionsToCat = new Set(Object.keys(functions));
    removeAll(functionsToCat, bases);
    let groupings = [];


    for (let b of bases) {
        let grp = [b];
        for (let f of functionsToCat) {
            if (distance(b, f) > 0.85) {
                grp.push(f);
                functionsToCat.delete(f);
            }
        }
        groupings.push(grp);
    }

    for (let f of functionsToCat.values()) {
        groupings.push([f]);
    }

    var table = document.createElement('table');

    table.classList.add('cleandoc-table');
    let tblBody = document.createElement("tbody");


    for (let c of groupings) {
        renderFunctionsAgainstBase(functions[c[0]],
            c.slice(1).map(f => functions[f]),
            tblBody,
            maxTypeSize);
    }

    table.append(tblBody);
    let hr = document.getElementsByTagName('hr')[0].insertAdjacentElement('afterend', table);

    for (let e of document.querySelectorAll('[class^=desc-code]')) {
        let maxWidth = 0;
        let selectedElements = document.getElementsByClassName(e.className);
        for (var i = 0; i < selectedElements.length; i++) {
            maxWidth = Math.max(maxWidth, selectedElements[i].getBoundingClientRect().width);
        }

        for (var i = 0; i < selectedElements.length; i++) {
            selectedElements[i].style.width = maxWidth;
            selectedElements[i].style.display = 'inline-block';
        }
    }

    var curr = table.nextSibling;
    while (curr != null) {
        let tmp = curr.nextSibling;
        curr.remove();
        curr = tmp;

    }
}

let [sidebar] = Array.from(document.getElementsByClassName('toc')).slice(-1);

let btn = document.createElement("button");
btn.innerHTML = "CleanDoc Me!";
btn.onclick = renderCleanDoc;

sidebar.appendChild(btn);
