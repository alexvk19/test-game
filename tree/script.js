

var fileInput, textArea, toc, bodyPanel, tocPanel, editPanel, headerArea, saveBtn;

window.onload = function () { 
    headerArea = document.getElementById('headerArea');
    bodyPanel = document.getElementById('body-panel');
    tocPanel = document.getElementById('toc-panel');
    editPanel = document.getElementById('edit-panel');

    if (vkBridge)
        vkBridge.send("VKWebAppInit", {})
        .then(data => {console.log("success!"); console.log(data.result); } )
        .catch(error => {console.log("error!");  console.log(error); } );

    fileInput = document.getElementById('readFileField');
    textArea = document.getElementById('treeSource');
    readFileField.addEventListener('change', handleFileInputChange);

    let updateBtn = document.getElementById('update-tree-btn');
    updateBtn.addEventListener('click', updateTreeFromTextArea);

    saveBtn = document.getElementById('save-file-btn');
    saveBtn.addEventListener('click', saveFile);

    toc = new Tabulator("#toc", {
        data: [],
        dataTree: true,
        columns: [
            {title: 'File', field: 'name', sorter:"string", width:350, editor:false}
        ]
    });
}

function parseTreeData(sourceText) {
    let result = [];
    let sourceStrings = sourceText.split('\n');
    let currentIndex = 0;

    let startIndent = detectIndent(0);
    while(currentIndex < sourceStrings.length) {
        let r = handleLine(startIndent);
        if (r)
            result.push(r);
        currentIndex++;
    }

    return result;

    function handleLine(currentIndent) {

        let r = undefined;
        let s = sourceStrings[currentIndex].trim(); 
        if (s == '') 
            return r;

        r = { name: s };

        let nextIndent = detectIndent(currentIndex + 1);
        if (nextIndent && nextIndent > currentIndent) {
            r._children = [];
            while ( nextIndent && nextIndent > currentIndent) {
                currentIndex++;
                let r2 = handleLine(nextIndent);
                if (r2)
                    r._children.push(r2);
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
        console.log('data', r);
        toc.setData(r);
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
    toc.setData(obj);
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