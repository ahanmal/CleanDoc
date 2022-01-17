import { renderBaseRow } from './renders/base';
import { generateCompRow } from './renders/comparison';
import { parseFunctionList, buildCluster, getListOfSections } from './parser';

import '../styles/contentScript.scss';

let parsedFunctions = null;

function renderFunctionsAgainstBase(functions, tblBody, maxTypeSize) {
    let nextFun = functions.length > 1 ? functions[1] : null;
    tblBody.append(renderBaseRow(functions[0], nextFun, maxTypeSize));

    for (let i = 1; i < functions.length; i++) {
        let row = generateCompRow(functions[i - 1],
                                  functions[i],
                                  maxTypeSize);
        tblBody.append(row);
    }
}

function renderCleanDoc() {

    document.getElementsByClassName('api')[0].style = 'margin-left: calc(10vw + 6ex) !important;';

    if (!parsedFunctions) {
        parsedFunctions = parseFunctionList();
    }

    let sectionList = getListOfSections();
    let functionsObj = buildCluster(parsedFunctions);

    var table = document.createElement('table');

    table.classList.add('cleandoc-table');
    let tblBody = document.createElement("tbody");

    for (let s of sectionList) {
        let funcs = functionsObj.sectionToGroups[s];
        if (funcs == null) {
            continue;
        }
        funcs.forEach(funcGroup => {
            renderFunctionsAgainstBase(funcGroup, tblBody, functionsObj.maxTypeSize);
        });
    }

    table.append(tblBody);
    let hr = document.getElementsByTagName('hr')[0]
        .insertAdjacentElement('afterend', table);

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

let sliderDiv = document.createElement("div");
sliderDiv.innerHTML = '<h4>Adjust Grouping</h4> <input type="range" min="1" max="100" value="50" class="slider" id="cutRange"> \
                      <p>Dragging the slider to the right will increase cluster size.</p>';
sliderDiv.className = 'slidecontainer';

sidebar.appendChild(btn);
sidebar.appendChild(sliderDiv);

document.getElementById("cutRange").oninput = function() {
    renderCleanDoc();
}
