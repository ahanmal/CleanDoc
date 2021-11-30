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

export function renderBaseRow(base, maxTypeLength) {
    let baseRow = document.createElement("tr");
    baseRow.className = 'tr-base';

    let tdEl = document.createElement('td');
    tdEl.className = 'td-section';
    tdEl.style.backgroundColor = base['color'];
    tdEl.style.color = base['sectionTextColor'];
    tdEl.append(base['sectionName']);
    baseRow.appendChild(tdEl);

    let nameCodeElements = generateCodeElements('\xA0'.repeat(NAME_PRE_SPACES) + base['name'], 'funName');
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
