

var fileInput, textArea, toc, bodyPanel, tocPanel, editPanel, headerArea, saveBtn, tabHeader, textAreaToolbar;

window.onload = function () { 
    if (vkBridge)
        vkBridge.send("VKWebAppInit", {})
        .then(data => {console.log("success!"); console.log(data.result); } )
        .catch(error => {console.log("error!");  console.log(error); } );

    headerArea = document.getElementById('headerArea');
    bodyPanel = document.getElementById('body-panel');
    tocPanel = document.getElementById('toc-panel');
    editPanel = document.getElementById('edit-panel');
    toc = document.getElementById('toc');
    tabHeader = document.getElementById('t1-h0');
    textAreaToolbar = document.getElementById('textAreaToolbar');
    contentsBox = document.getElementById('contents'); 

    fileInput = document.getElementById('readFileField');
    textArea = document.getElementById('textArea');
    readFileField.addEventListener('change', handleFileInputChange);

    let updateBtn = document.getElementById('update-tree-btn');
    updateBtn.addEventListener('click', updateTreeFromTextArea);

    saveBtn = document.getElementById('save-file-btn');
    saveBtn.addEventListener('click', saveFile);

    const sheet = new CSSStyleSheet();
    sheet.replaceSync("ul {padding-inline-start: 0px; list-style-type: none; } \n li.open.branch > ul { padding-inline-start: 1rem; } ");
    toc.shadowRoot.adoptedStyleSheets = [sheet];

    initializeTree();
    updateHeights();
    window.addEventListener('resize', updateHeights);

    toc.addEventListener('vsc-tree-select', onNodeSelect);
}

function updateHeights() {
    let h = document.documentElement.clientHeight - headerArea.offsetHeight;
    bodyPanel.style.height = h + 'px';
    editPanel.style.height = h - 4 + 'px';
    tocPanel.style.height = h + 'px';
    textArea.style.height = editPanel.offsetHeight - tabHeader.offsetHeight - textAreaToolbar.offsetHeight + 'px';
    //textArea.style.minHeight = editPanel.offsetHeight - tabHeader.offsetHeight + 'px';
    //textArea.style.maxHeight = editPanel.offsetHeight - tabHeader.offsetHeight + 'px';
    //textArea.style.width = editPanel.offsetWidth + 'px';
}

const icons = {
    branch: 'chevron-right', // 'folder',
    leaf: ' ', // 'file',
    open: 'chevron-down' // 'folder-opened',
}

function parseTreeData(sourceText) {
    let result = [];
    let preparedText = sourceText.replace(/\t/gm, '    ');
    let sourceStrings = preparedText.split('\n');
    let currentIndex = 0;

    let startIndent = detectIndent(0);
    while(currentIndex < sourceStrings.length) {
        let r = handleLine(startIndent);
        if (r) {
            result.push(r);
        }
        currentIndex++;
    }

    return result;

    function handleLine(currentIndent) {

        let r = undefined;
        let s = sourceStrings[currentIndex].trim(); 
        if (s == '') 
            return r;

        // r = { name: s };
        let label = '';
        let description = '';
        let sep = '///';
        let idx = s.indexOf(sep);
        if (idx >= 0) {
            label = s.substring(0, idx).trim();
            description = s.substring(idx + sep.length).trim();
        } else {
            label = s;
            description = ' ';
        }
        r = { icons, label: label, value: description};

        let nextIndent = detectIndent(currentIndex + 1);
        if (nextIndent && nextIndent > currentIndent) {
            // r._children = [];
            r.subItems = [];
            while ( nextIndent && nextIndent > currentIndent) {
                currentIndex++;
                let r2 = handleLine(nextIndent);
                if (r2) {
                    // r._children.push(r2);
                    r.subItems.push(r2);
                }
                nextIndent = detectIndent(currentIndex + 1);
            }
        }

        return r;
    }    

    function detectIndent(index) {
        let r = undefined;

        if (index < sourceStrings.length) {
            let countSpaces = 0;
            let s = sourceStrings[index];
            while( countSpaces < s.length && s.charAt(countSpaces) == ' ' ) {
                countSpaces++;
            }
            r = countSpaces;
        }

        return r;
    } 

}

function readFile(source) {
    const reader = new FileReader();
    reader.addEventListener('load', (event) => {
        textArea.value = event.target.result;
        let r = parseTreeData(textArea.value);
        // toc.setData(r);
        toc.data = r;
    });
    reader.readAsText(source);
}

function handleFileInputChange(event) {
    event.preventDefault();
    readFile(fileInput.files[0]);
    fileInput.value = '';
    fileInput.blur();
}

function updateTreeFromTextArea() {
    let s = textArea.value;
    let obj = parseTreeData(s);
    // toc.setData(obj);
    toc.data = obj;
}

function saveFile(event) {
    let s = textArea.value;
    saveBtn.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(s));
    // saveBtn.dispatchEvent(event);
    // download('new-toc.txt', s);
}

/*
function download(filename, text) {
    let pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    pom.setAttribute('download', filename);
    if (document.createEvent) {
        let event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    }
    else {
        pom.click();
    }
} */

function initializeTree() {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4) {
            if (this.status == 200) {
                let s = this.responseText;
                let preparedData = parseTreeData(s.trim());
                toc.data = preparedData; 
                textArea.value = s;
            }
            if (this.status == 404) { 
                let d = [
                    { icons, label: '{Ошибка загрузки, попробуйте вручную}'}
                ];
                toc.data = d;
            }
        } 
    }   
    xhttp.open("GET", "./toc.txt", true);
    xhttp.send();
};

function onNodeSelect(ev) {
    let node = ev.detail;
    contentsBox.innerHTML = node.value; 
}
