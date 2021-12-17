import { diffText } from '../diff';
import { generateCodeElements, generateTooltipHtml } from './utils';

const NAME_PRE_SPACES = 10;

function generateTypeElements(typeList, maxTypeLength) {
    let tdElements = [];
    for (let i = 0; i < maxTypeLength; i++) {
        if (i < typeList.length) {
            let typeCodeElements = generateCodeElements(typeList[i]);
            tdElements.push(typeCodeElements.td);
            if (i < typeList.length - 1) {
                let spacerElements = generateCodeElements('->', 'typeSplitter');
                tdElements.push(spacerElements.td);
            }
        } else {
            tdElements.push(document.createElement('td'));
            tdElements.push(document.createElement('td'));
        }
    }
    return tdElements;
}

function calculateSpaceOffset(base, next) {
    if (next == null) {
        return NAME_PRE_SPACES;
    }
    let nameDiff = diffText(next['name'], base['name']);
    if (nameDiff.length > 0 && nameDiff[0].type == 'insertion') {
        return NAME_PRE_SPACES - nameDiff[0].text.length;
    } else {
        return NAME_PRE_SPACES;
    }
}

export function renderBaseRow(base, next, maxTypeLength) {
    let baseRow = document.createElement("tr");
    baseRow.className = 'tr-base';

    let tdEl = document.createElement('td');
    tdEl.className = 'td-section';
    tdEl.style.backgroundColor = base['color'];
    tdEl.style.color = base['sectionTextColor'];
    tdEl.append(base['sectionName']);
    baseRow.appendChild(tdEl);

    let preSpaces = calculateSpaceOffset(base, next);
    let nameCodeElements = generateCodeElements('\xA0'.repeat(preSpaces) + base['name'], 'funName');
    nameCodeElements.td.className = 'headcol';
    baseRow.appendChild(nameCodeElements.td);

    let typeElements = generateTypeElements(base['typeList'], maxTypeLength);
    typeElements.forEach(el => {
        baseRow.appendChild(el);
    });

    baseRow.appendChild(generateTooltipHtml(base));

    tdEl = document.createElement('td');
    tdEl.className = 'td-desc td-desc-base';
    tdEl.append(base['desc']);
    baseRow.appendChild(tdEl);


    return baseRow;
}
