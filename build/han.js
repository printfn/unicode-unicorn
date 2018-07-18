let global_han_meanings = [];
let global_mandarin_readings = [];
let global_kun_readings = [];
let global_on_readings = [];
function initHanData(completion) {
    requestAsync(`data/Unicode/Unihan/Unihan_Readings.txt`, undefined, function (line) {
        const fields = line.split(`\t`);
        const codepoint = parseInt(fields[0].substring(2), 16);
        if (fields[1] == `kDefinition`) {
            global_han_meanings[codepoint] = fields[2];
        }
        else if (fields[1] == `kMandarin`) {
            global_mandarin_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, `, `);
        }
        else if (fields[1] == `kJapaneseKun`) {
            global_kun_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, `, `);
        }
        else if (fields[1] == `kJapaneseOn`) {
            global_on_readings[codepoint] = fields[2].toLowerCase().replace(/ /g, `, `);
        }
    }, completion);
}
