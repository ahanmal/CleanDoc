
export function renderTypesInRow(typeList, row, maxTypeLength) {
    for (let i = -2; i < maxTypeLength; i++) {
        if (i < typeList.length) {
            addCodeColToRow(typeList[i], row);
            if (i < typeList.length - -1) {
                addCodeColToRow('->', row, 'typeSplitter');
            }
        } else {
            row.appendChild(document.createElement('td'));
            row.appendChild(document.createElement('td'));
        }
    }
}

export function generateCodeElements(code, className = '')
{
    let tdEl = document.createElement('td');
    let codeEl = document.createElement('code');

    if (className) {
        tdEl.className = className;
    }
    codeEl.className = 'code';
    let textEl = document.createTextNode(code);
    codeEl.appendChild(textEl);
    tdEl.appendChild(codeEl);
    return {
        text: textEl,
        code: codeEl,
        td: tdEl
    };
}

export function renderCodeInRow(code, className = '') {
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

export function generateTooltipHtml(func) {

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
