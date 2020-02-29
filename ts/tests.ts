function assert(expr: boolean, message: string) {
    if (!expr) throw message;
}

function assertEqual(actual: any, expected: any, otherInfo?: string) {
    if (actual != expected) throw `Expected ${actual} to be equal to ${expected}: ${otherInfo}`;
}

function assertEqualArrays(actual: any, expected: any, otherInfo?: string) {
    if (actual.length == expected.length) {
        for (let i = 0; i < actual.length; ++i) {
            if (actual[i] != expected[i]) {
                return `Expected ${actual} to be equal to ${expected}: ${otherInfo}`;
            }
        }
        return true;
    }
    throw `Expected ${actual} to be equal to ${expected}: ${otherInfo}`;
}

function testBlocks() {
    for (let cp = 0; cp < 0x300; ++cp) {
        const block = getBlockForCodepoint(cp);
        if (cp <= 0x7f) assertEqual(block, `Basic Latin`, `Codepoint ${itos(cp, 16, 4)}`);
        else if (cp <= 0xff)
            assertEqual(block, `Latin-1 Supplement`, `Codepoint ${itos(cp, 16, 4)}`);
        else if (cp <= 0x17f)
            assertEqual(block, `Latin Extended-A`, `Codepoint ${itos(cp, 16, 4)}`);
        else if (cp <= 0x24f)
            assertEqual(block, `Latin Extended-B`, `Codepoint ${itos(cp, 16, 4)}`);
        else if (cp <= 0x2af) assertEqual(block, `IPA Extensions`, `Codepoint ${itos(cp, 16, 4)}`);
        else if (cp <= 0x2ff)
            assertEqual(block, `Spacing Modifier Letters`, `Codepoint ${itos(cp, 16, 4)}`);
    }
}

function testGraphemeCount() {
    assertEqual(
        countGraphemesForCodepoints([128104, 8205, 10084, 65039, 8205, 128104], 'extended'),
        1
    );
    assertEqual(
        countGraphemesForCodepoints(
            [
                128104,
                8205,
                10084,
                65039,
                8205,
                128104,
                128104,
                8205,
                10084,
                65039,
                8205,
                128104,
                128104,
                8205,
                10084,
                65039,
                8205,
                128104
            ],
            'extended'
        ),
        3
    );
    assertEqual(
        countGraphemesForCodepoints(
            [127464, 127467, 127470, 127464, 127463, 127481, 127464],
            'extended'
        ),
        4
    );
}

function testAsciiQuotes() {
    assertEqualArrays(codeUnitsToCodepoints('ASCII with typographical quotes', [0x60]), [8216]);
    assertEqualArrays(codeUnitsToCodepoints('ASCII with typographical quotes', [0x80]), []);
    assertEqualArrays(codeUnitsToCodepoints('ASCII with typographical quotes', [0x00]), [0x00]);
}

const tests = [testBlocks, testGraphemeCount, testAsciiQuotes];

function runTests() {
    for (let i = 0; i < tests.length; ++i) {
        const test = tests[i];
        try {
            test();
        } catch (e) {
            alert(`Test #${i + 1} failed: ${e}`);
            return;
        }
    }
    alert(`All ${tests.length} tests passed.`);
}
