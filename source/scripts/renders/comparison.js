import { diffText } from '../diff';
import { generateCodeElements, generateTooltipHtml } from './utils';

const NAME_PRE_SPACES = 10;

function generateSectionTag(comp) {
    let tdEl = document.createElement('td');
    tdEl.className = 'td-section';
    tdEl.style.backgroundColor = comp['color'];
    tdEl.style.color = comp['sectionTextColor'];
    tdEl.append(comp['sectionName']);

    return tdEl;
}

function generateNameColumn(base, comp) {
    let codeElements = generateCodeElements('', 'funName');
    let nameCodeEl = codeElements.code;

    let nameDiff = diffText(base['name'], comp['name']);
    nameDiff.forEach((part, i) => {
        let span = document.createElement('span');
        span.style.color = part.color;
        if (i == 0) {
            let preSpaceCount = part.type == 'insertion' ? NAME_PRE_SPACES - part.text.length : NAME_PRE_SPACES;
            let printPart = part.type != 'deletion' ? part.text : '';
            span.appendChild(document.createTextNode('\xA0'.repeat(preSpaceCount) + printPart));
        } else if (part.type != 'deletion') {
            span.appendChild(document.createTextNode(part.text));
        }
        nameCodeEl.appendChild(span);
    });
    codeElements.td.className = 'headcol';

    return codeElements.td;
}

function generateTypeColumns(typeList, baseTypeList, maxTypeLength) {
    let tdElements = [];
    for (let i = 0; i < maxTypeLength; i++) {
        if (i < typeList.length) {
            if (i < baseTypeList.length) {
                let codeElements = generateCodeElements('');
                let typeDiff = diffText(baseTypeList[i], typeList[i]);
                typeDiff.forEach(part => {
                    if (part.type != 'deletion') {
                        let span = document.createElement(span);
                        span.style.color = part.color;
                        span.appendChild(document.createTextNode(part.text));
                        codeElements.code.appendChild(span);
                    }
                });
                tdElements.push(codeElements.td);
            } else {
                let codeElements = generateCodeElements(typeList[i]);
                tdElements.push(codeElements.td);
            }

            if (i < typeList.length - 1) {
                let splitElements = generateCodeElements('->', 'typeSplitter');
                tdElements.push(splitElements.td);
            }
        } else {
            tdElements.push(document.createElement('td'));
            tdElements.push(document.createElement('td'));
        }
    }

    return tdElements;
}

function buildDiffCodeComp(compChild, baseChild, alignSpacing) {
    let codeBlock = document.createElement('code');

    let codeDiff = diffText(baseChild.textContent, compChild.textContent);
    codeDiff.forEach((part, index) => {
        let span = document.createElement('span');
        span.style.color = part.color;
        if (alignSpacing && index == 0) {
            let preSpaceCount = part.type == 'insertion'
                                    ? NAME_PRE_SPACES - part.text.length
                                    : NAME_PRE_SPACES;
            let printPart = part.type != 'deletion' ? part.text : '';
            span.appendChild(document.createTextNode('\xA0'.repeat(preSpaceCount) + printPart));
        } else {
            if (part.type == 'deletion') {
                return;
            }
            span.appendChild(document.createTextNode(part.text));
        }
        codeBlock.appendChild(span);
    });
    return codeBlock;
    }

function buildDiffTextComp(compChild, baseChild) {
    let outerSpan = document.createElement('span');
    let textDiff = diffText(baseChild.textContent, compChild.textContent);
    textDiff.forEach((part, index) => {
        if (part.type == 'deletion') {
            return;
        }
        let span = document.createElement('span');
        span.style.color = part.color;
        span.appendChild(document.createTextNode(part.text));
        outerSpan.appendChild(span);
    });
    return outerSpan;
}

function generateDiffedDesc(compChildNodes, baseChildNodes, descTdEl) {
    for (let i = 0; i < compChildNodes.length; i++)
    {
        let compChild = compChildNodes[i];
        let baseChild = baseChildNodes[i];
        // Check if the both comp and base nodes are text nodes or not.
        if (compChild.nodeName == 'CODE' && baseChild.nodeName == 'CODE') {
            // If they are both code nodes, then we should render a
            // diff.
            descTdEl.appendChild(buildDiffCodeComp(compChild, baseChild, false));
        } else {
            descTdEl.appendChild(buildDiffTextComp(compChild, baseChild));
        }
    }
}

function generateDescriptionColumn(base, comp) {
    let descTdEl = document.createElement('td');
    descTdEl.className = 'td-desc'

    let descChildNodes = Array.from(comp['desc'].children[0].childNodes);
    let baseDescChildNodes = Array.from(base['desc'].children[0].childNodes);

    if (descChildNodes.length == baseDescChildNodes.length) {
        generateDiffedDesc(descChildNodes, baseDescChildNodes, descTdEl);
    } else {
        descTdEl.appendChild(comp['desc']);
    }
    return descTdEl;
}


export function generateCompRow(base, comp, maxTypeLength) {

    let compRow = document.createElement('tr');
    compRow.appendChild(generateSectionTag(comp));
    compRow.appendChild(generateNameColumn(base, comp));

    let typeElements = generateTypeColumns(comp['typeList'], base['typeList'], maxTypeLength);
    typeElements.forEach(el => {
        compRow.appendChild(el);
    });

    compRow.appendChild(generateTooltipHtml(comp));
    compRow.appendChild(generateDescriptionColumn(base, comp));

    return compRow;

}

