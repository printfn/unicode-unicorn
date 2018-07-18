function requestAsync(url, before, each, after) {
    const req = new XMLHttpRequest();
    req.open(`GET`, url, true);
    req.onload = function () {
        const str = req.response;
        const lines = str.split('\n');
        if (before)
            before(lines);
        if (each) {
            for (let i = 0; i < lines.length; ++i) {
                let line = lines[i];
                if (line.length === 0 || line[0] == `#`) {
                    continue;
                }
                if (line.indexOf(`#`) != -1) {
                    line = line.substring(0, line.indexOf(`#`));
                }
                each(line);
            }
        }
        if (after) {
            after();
        }
    };
    req.send(null);
}
function callMultipleAsync(functions, completion) {
    let count = 0;
    const callback = function () {
        ++count;
        if (count == functions.length) {
            completion();
        }
    };
    for (let i = 0; i < functions.length; ++i) {
        functions[i](callback);
    }
}
