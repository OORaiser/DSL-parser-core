import Core from './core.js';

const State = {
    GROUP: 'GROUP',
    PATTERN: 'PATTERN',
    UNIT: 'UNIT',
    PARAM: 'PARAM',
    PARAM_KEY: 'PARAM_KEY',
    PARAM_VALUE: 'PARAM_VALUE',
    PARAM_VALUE_STRING: 'PARAM_VALUE_STRING'
};

const Config = {
    [State.GROUP]: {
        [Core.INIT_STATE]: true,
        from: [State.GROUP, State.PATTERN, State.PARAM_VALUE],
        start: '(',
        end: ')'
    },
    [State.PATTERN]: {
        from: [State.GROUP, State.PARAM_VALUE],
        start: Core.START_MATCH_ALL,
        startDrop: false,
        endByParent: true,
        end: '|'
    },
    [State.UNIT]: {
        from: [State.PATTERN],
        start: [
            '>',
            {
                mark: Core.START_MATCH_ALL,
                drop: false
            }
        ],
        endByParent: true,
        end: '>'
    },
    [State.PARAM]: {
        from: [State.UNIT],
        start: '[',
        end: ']'
    },
    [State.PARAM_KEY]: {
        from: [State.PARAM],
        start: Core.START_MATCH_ALL,
        startDrop: false
    },
    [State.PARAM_VALUE]: {
        from: [State.PARAM_KEY],
        start: '='
    },
    [State.PARAM_VALUE_STRING]: {
        from: [State.PARAM_VALUE],
        start: '"',
        end: '"'
    }
};

const parserCore = new Core(Config);

parserCore.read(`A>B[C=D]>(E>F|G>H)`);
let result;
while ((result = parserCore.next())) {
    console.log(result);
}