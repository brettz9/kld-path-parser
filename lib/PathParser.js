/**
 *  PathParser.js
 *
 *  @copyright 2003, 2017 Kevin Lindsey
 *  @module PathParser
 */

import PathLexer from "./PathLexer.js";
import PathLexeme from "./PathLexeme.js";


/**
 *  PathParser
 */
class PathParser {
    /**
     * constructor
     */
    constructor() {
        this._lexer = new PathLexer();
        this._handler = null;
    }

    /**
     *  parseData
     *
     *  @param {string} pathData
     *  @throws {Error}
     */
    parseData(pathData) {
        if (typeof pathData !== "string") {
            throw new Error("PathParser.parseData: The first parameter must be a string");
        }

        // init handler
        if (this._handler !== null && typeof this._handler.beginParse === "function") {
            this._handler.beginParse();
        }

        // pass the pathData to the lexer
        const lexer = this._lexer;

        lexer.setPathData(pathData);

        // set mode to signify new path
        // NOTE: BOP means Beginning of Path
        let mode = "BOP";

        // Process all tokens
        let token = lexer.getNextToken();

        while (token.typeis(PathLexeme.EOD) === false) {
            let parameterCount;
            const params = [];

            // process current token
            switch (token.type) {
                case PathLexeme.COMMAND:
                    if (mode === "BOP" && token.text !== "M" && token.text !== "m") {
                        throw new Error("PathParser.parseData: a path must begin with a moveto command");
                    }

                    // Set new parsing mode
                    mode = token.text;

                    // Get count of numbers that must follow this command
                    parameterCount = PathParser.PARAMCOUNT[token.text.toUpperCase()];

                    // Advance past command token
                    token = lexer.getNextToken();
                    break;

                case PathLexeme.NUMBER:
                    // Most commands allow you to keep repeating parameters
                    // without specifying the command again.  We just assume
                    // that is the case and do nothing since the mode remains
                    // the same and param_count is already set
                    break;

                default:
                    throw new Error("PathParser.parseData: unrecognized token type: " + token.type);
            }

            // Get parameters
            for (let i = 0; i < parameterCount; i++) {
                switch (token.type) {
                    case PathLexeme.COMMAND:
                        throw new Error("PathParser.parseData: parameter must be a number: " + token.text);

                    case PathLexeme.NUMBER:
                        // convert current parameter to a float and add to
                        // parameter list
                        /* eslint-disable-next-line radix */
                        params[i] = parseInt(token.text, 10);
                        break;

                    default:
                        throw new Error("PathParser.parseData: unrecognized token type: " + token.type);
                }

                token = lexer.getNextToken();
            }

            // fire handler
            if (this._handler !== null) {
                const handler = this._handler;
                const methodName = PathParser.METHODNAME[mode];

                if (handler !== null && typeof handler[methodName] === "function") {
                    handler[methodName](...params);
                }
            }

            // Lineto's follow moveto when no command follows moveto params.  Go
            // ahead and set the mode just in case no command follows the moveto
            // command
            switch (mode) {
                case "M":
                    mode = "L";
                    break;
                case "m":
                    mode = "l";
                    break;
                default:
                    // ignore for now
            }
        }
    }

    /**
     *  setHandler
     *
     *  @param {Object} handler
     */
    setHandler(handler) {
        this._handler = handler;
    }
}

/*
 * class constants
 */
PathParser.PARAMCOUNT = {
    A: 7,
    C: 6,
    H: 1,
    L: 2,
    M: 2,
    Q: 4,
    S: 4,
    T: 2,
    V: 1,
    Z: 0
};
PathParser.METHODNAME = {
    A: "arcAbs",
    a: "arcRel",
    C: "curvetoCubicAbs",
    c: "curvetoCubicRel",
    H: "linetoHorizontalAbs",
    h: "linetoHorizontalRel",
    L: "linetoAbs",
    l: "linetoRel",
    M: "movetoAbs",
    m: "movetoRel",
    Q: "curvetoQuadraticAbs",
    q: "curvetoQuadraticRel",
    S: "curvetoCubicSmoothAbs",
    s: "curvetoCubicSmoothRel",
    T: "curvetoQuadraticSmoothAbs",
    t: "curvetoQuadraticSmoothRel",
    V: "linetoVerticalAbs",
    v: "linetoVerticalRel",
    Z: "closePath",
    z: "closePath"
};

export default PathParser;