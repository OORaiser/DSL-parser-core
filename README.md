# DSL-parser-core
A parser core for your DSL based on fsm.

## test.js
input: `A>B[C=D]>(E>F|G>H)`

```bash
% node test.js
{"level":0,"state":"GROUP","consume":"","start":""}
{"level":1,"state":"PATTERN","consume":"","start":""}
{"level":2,"state":"UNIT","consume":"A","start":""}
{"level":2,"state":"UNIT","consume":"A","end":""}
{"level":1,"state":"PATTERN","consume":"","start":""}
{"level":2,"state":"UNIT","consume":"B","start":""}
{"level":3,"state":"PARAM","consume":"","start":"["}
{"level":4,"state":"PARAM_KEY","consume":"C","start":""}
{"level":5,"state":"PARAM_VALUE","consume":"","start":"="}
{"level":6,"state":"PATTERN","consume":"","start":""}
{"level":7,"state":"UNIT","consume":"D","start":""}
{"level":7,"state":"UNIT","consume":"D","end":""}
{"level":6,"state":"PATTERN","consume":"","end":""}
{"level":5,"state":"PARAM_VALUE","consume":"","end":""}
{"level":4,"state":"PARAM_KEY","consume":"","end":""}
{"level":3,"state":"PARAM","consume":"","end":"]"}
{"level":2,"state":"UNIT","consume":"","end":""}
{"level":1,"state":"PATTERN","consume":"","start":""}
{"level":2,"state":"GROUP","consume":"","start":"("}
{"level":3,"state":"PATTERN","consume":"","start":""}
{"level":4,"state":"UNIT","consume":"E","start":""}
{"level":4,"state":"UNIT","consume":"E","end":""}
{"level":3,"state":"PATTERN","consume":"","start":""}
{"level":4,"state":"UNIT","consume":"F","start":""}
{"level":4,"state":"UNIT","consume":"F","end":""}
{"level":3,"state":"PATTERN","consume":"","end":"|"}
{"level":2,"state":"GROUP","consume":"","start":"("}
{"level":3,"state":"PATTERN","consume":"","start":""}
{"level":4,"state":"UNIT","consume":"G","start":""}
{"level":4,"state":"UNIT","consume":"G","end":""}
{"level":3,"state":"PATTERN","consume":"","start":""}
{"level":4,"state":"UNIT","consume":"H","start":""}
{"level":4,"state":"UNIT","consume":"H","end":""}
{"level":3,"state":"PATTERN","consume":"","end":""}
{"level":2,"state":"GROUP","consume":"","end":")"}
{"level":1,"state":"PATTERN","consume":"","end":""}
{"level":0,"state":"GROUP","consume":"","end":""}
```
