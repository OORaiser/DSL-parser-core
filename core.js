import StringPointer from './string-pointer.js';

class Core {
    constructor(config = {}) {
        this.stringPointer = new StringPointer();
        this.setConfig(config);
    }

    static INIT_STATE = '__INIT__';
    static START_MATCH_ALL = 'START_MATCH_ALL';

    reset(isForce = false) {
        if (isForce) {
            this._initialState = null;
            this._statesRelationMap = Object.create(null);
            this._statesDef = Object.create(null);
        }

        this.buffer = [];
        this.stringPointer.reset();
        this._output = [];
        this._stateInfoStack = this._initialState
            ? [
                {
                    state: this._initialState,
                    start: ''
                }
            ]
            : [];
    }

    setInitialState(state) {
        if (Reflect.has(this._statesDef, state)) {
            this._initialState = state;
            this.reset();
        } else {
            log.warn('Unknown state.');
        }
    }

    formatStateDef(state, def) {
        const formatMark = (mark, defaultProps) => {
            const markObj = Object.create(null);
            Object.assign(
                markObj,
                typeof mark === 'object'
                    ? {
                        mark: mark.mark,
                        drop: Reflect.has(mark, 'drop')
                            ? mark.drop
                            : defaultProps.drop
                    }
                    : {
                        mark: mark.toString(),
                        drop: defaultProps.drop
                    }
            );

            return markObj;
        };

        const { from, start, end, startDrop, endDrop, endByParent } = def;
        const formattedDef = Object.create(null);

        const isDropStart = typeof startDrop === 'boolean' ? startDrop : true;
        const isDropEnd = typeof endDrop === 'boolean' ? endDrop : true;

        formattedDef.state = state;
        formattedDef.from = from ? [].concat(from) : [];
        formattedDef.start = start
            ? [].concat(start).map(mark =>
                formatMark(mark, {
                    drop: isDropStart
                })
            )
            : [];
        formattedDef.end = end
            ? [].concat(end).map(mark =>
                formatMark(mark, {
                    drop: isDropEnd
                })
            )
            : [];
        formattedDef.endByParent =
            typeof endByParent === 'boolean'
                ? endByParent
                : !formattedDef.end.length;

        return formattedDef;
    }

    setConfig(config) {
        this.reset(true /* isForce */);

        Object.entries(config).forEach(([key, value]) => {
            this._statesDef[key] = this.formatStateDef(key, value);
            if (value[Core.INIT_STATE]) {
                this.setInitialState(key);
            }
        });

        Object.entries(this._statesDef).forEach(([state, stateDef]) => {
            stateDef.from.forEach(fromState => {
                if (!Reflect.has(this._statesDef, fromState)) {
                    this._statesDef[fromState] = { from: [] };
                }

                this._statesRelationMap[fromState] =
                    this._statesRelationMap[fromState] || [];
                if (
                    this._statesDef[state].start.some(
                        item => item.mark === Core.START_MATCH_ALL
                    )
                ) {
                    this._statesRelationMap[fromState].push(state);
                } else {
                    this._statesRelationMap[fromState].unshift(state);
                }
            });
        });
    }

    tryMatchMarkBuffer(mark, buffer) {
        if (mark === Core.START_MATCH_ALL) {
            return {
                match: true,
                key: this.buffer[this.buffer.length - 1]
            };
        }

        if (mark instanceof RegExp) {
            const result = mark.match(this.buffer.join(''));
            const isMatched = result
                ? result[0] === this.buffer.slice(-result[0].length).join('')
                : false;

            return isMatched
                ? {
                    match: true,
                    key: result[0]
                }
                : {
                    match: false
                };
        }

        const bufferKey = (buffer || this.buffer).slice(-mark.length).join('');
        return mark === bufferKey
            ? {
                match: true,
                key: bufferKey
            }
            : {
                match: false
            };
    }

    read(string) {
        this.stringPointer.setString(string);
        this.reset();
    }

    tryMatchStateEnd() {
        const currLevel = this._stateInfoStack.length - 1;
        const currStateInfo = this._stateInfoStack[currLevel];
        let currMatchStateDef = this._statesDef[currStateInfo.state];
        let parentLevel = 0;

        let isUnderParentLevel = false;
        let matchTemp;
        let matchResultTemp;

        while (currMatchStateDef) {
            for (let i = 0; i < currMatchStateDef.end.length; i++) {
                matchTemp = currMatchStateDef.end[i];

                matchResultTemp = this.tryMatchMarkBuffer(matchTemp.mark);
                if (matchResultTemp.match) {
                    const matchKeyLength = matchResultTemp.key.length;

                    this.buffer.length -= matchKeyLength;
                    this._stateInfoStack.pop();
                    if (!currStateInfo._isOutputed) {
                        this._output.push({
                            level: currLevel,
                            state: currStateInfo.state,
                            consume: this.buffer.join(''),
                            start: currStateInfo.start
                        });
                    }
                    this._output.push({
                        level: currLevel,
                        state: currStateInfo.state,
                        consume: this.buffer.join(''),
                        end:
                            isUnderParentLevel || matchTemp.drop
                                ? ''
                                : matchResultTemp.key
                    });
                    this.buffer.length = 0;

                    if (!matchTemp.drop) {
                        new Array(matchKeyLength).fill(null)
                            .forEach(() => {
                                this.stringPointer.backward();
                            });
                    }

                    if (isUnderParentLevel) {
                        for (let j = 0; j < parentLevel; j++) {
                            this._output.push({
                                level: this._stateInfoStack.length - 1 - j,
                                state: this._stateInfoStack[
                                    this._stateInfoStack.length - 1 - j
                                ].state,
                                consume: '',
                                end:
                                    j === parentLevel - 1
                                        ? matchResultTemp.key
                                        : ''
                            });
                        }
                        this._stateInfoStack.length -= parentLevel;
                    }
                    return;
                }
            }

            if (!currMatchStateDef.endByParent) return;

            isUnderParentLevel = true;
            parentLevel += 1;
            currMatchStateDef = this._statesDef[
                this._stateInfoStack[currLevel - parentLevel].state
            ];
        }
    }

    tryMatchStateStart() {
        const currLevel = this._stateInfoStack.length - 1;
        const currStateInfo = this._stateInfoStack[currLevel];
        const relatedStates = this._statesRelationMap[currStateInfo.state];

        if (!relatedStates) return;

        let relatedStateTemp;
        let relatedStateDefTemp;
        let matchTemp;
        let matchResultTemp;

        const matchedCollect = [];

        for (let i = 0; i < relatedStates.length; i++) {
            relatedStateTemp = relatedStates[i];
            relatedStateDefTemp = this._statesDef[relatedStateTemp];

            for (let j = 0; j < relatedStateDefTemp.start.length; j++) {
                matchTemp = relatedStateDefTemp.start[j];

                matchResultTemp = this.tryMatchMarkBuffer(matchTemp.mark);
                if (matchResultTemp.match) {
                    matchedCollect.push({
                        state: relatedStateTemp,
                        match: matchTemp,
                        matchResult: matchResultTemp
                    });
                    break;
                }
            }
        }

        // find out the best match start.
        if (matchedCollect.length) {
            const selectedIndex = matchedCollect.reduce(
                (targetIndex, matchData, index) =>
                    (matchData.matchResult.key.length >
                        matchedCollect[targetIndex].matchResult.key.length
                        ? index
                        : targetIndex),
                0
            );

            const { state, match, matchResult } = matchedCollect[selectedIndex];

            const matchKeyLength = matchResult.key.length;
            this._stateInfoStack.push({
                state: state,
                start: match.drop ? matchResult.key : ''
            });
            this.buffer.length -= matchKeyLength;

            if (!match.drop) {
                new Array(matchKeyLength).fill(null)
                    .forEach(() => {
                        this.stringPointer.backward();
                    });
            }

            this._output.push({
                level: currLevel,
                state: currStateInfo.state,
                consume: this.buffer.join(''),
                start: currStateInfo.start
            });
            currStateInfo._isOutputed = true;
            this.buffer.length = 0;

            return;
        }

        const parentState = this._stateInfoStack[currLevel - 1];
        const parentRelatedStates = this._statesRelationMap[parentState.state];
        const parentBuffer = [].concat(currStateInfo.start, this.buffer);

        for (let i = 0; i < parentRelatedStates.length; i++) {
            relatedStateTemp = parentRelatedStates[i];
            relatedStateDefTemp = this._statesDef[relatedStateTemp];

            if (relatedStateTemp === currStateInfo.state) continue;

            for (let j = 0; j < relatedStateDefTemp.start.length; j++) {
                matchTemp = relatedStateDefTemp.start[j];
                matchResultTemp = this.tryMatchMarkBuffer(
                    matchTemp.mark,
                    parentBuffer
                );

                if (
                    matchResultTemp.match &&
                    matchResultTemp.key.length > currStateInfo.start.length
                ) {
                    const matchKeyLength = matchResultTemp.key.length;
                    this._stateInfoStack.pop();
                    this._stateInfoStack.push({
                        state: relatedStateTemp,
                        start: matchTemp.drop ? matchResultTemp.key : ''
                    });
                    this.buffer.length = 0;

                    if (!matchTemp.drop) {
                        new Array(matchKeyLength).fill(null)
                            .forEach(() => {
                                this.stringPointer.backward();
                            });
                    }

                    return;
                }
            }
        }
    }

    next() {
        if (this._output.length) return this._output.shift();

        let isForwardSuccess;
        while ((isForwardSuccess = this.stringPointer.forward())) {
            const key = this.stringPointer.read();

            if (key === '\\') {
                this.stringPointer.forward();
                this.buffer.push(this.stringPointer.read());
                continue;
            }

            this.buffer.push(key);

            this.tryMatchStateEnd();
            if (this._output.length) break;

            this.tryMatchStateStart();
            if (this._output.length) break;
        }

        if (!isForwardSuccess && this._stateInfoStack.length) {
            this._output.push({
                level: this._stateInfoStack.length - 1,
                state: this._stateInfoStack.pop().state,
                consume: this.buffer.join(''),
                end: ''
            });
            this.buffer.length = 0;
        }

        return this._output.shift() || null;
    }
}

export default Core;
