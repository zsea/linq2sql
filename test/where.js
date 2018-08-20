const assert = require('power-assert');
const where = require("../lib/where");
//console.log(expression);

/**通用数据格式生成 */
var acorn = require("acorn");
function getTestData(expressionTree) {
    var ast = acorn.parse(expressionTree.toString());
    var statement = ast.body[0];
    if (statement.type != "ExpressionStatement") {
        throw new Error("not support ExpressionStatement");
    }
    statement = statement.expression;
    if (statement.type != "ArrowFunctionExpression") {
        throw new Error("not support ArrowFunctionExpression");
    }
    var param = statement.params[0];
    var body = statement.body;
    return {
        body: body,
        param: param
    }
}

describe("数据库信息测试", () => {
    it("{}", () => {
        var data = getTestData(p => p.x == 4);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 4 },
            operator: '='
        })
    })
    it("{table:\"table\"}", () => {
        var data = getTestData(p => p.x == 4);
        var lam = where(data.body, data.param, {}, { table: "table" });
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`table`.`x`' },
            right: { type: 'const', value: 4 },
            operator: '='
        })
    })
    it("{table:\"table\",db:\"employee\"}", () => {
        var data = getTestData(p => p.x == 4);
        var lam = where(data.body, data.param, {}, { table: "table", db: "employee" });
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`employee`.`table`.`x`' },
            right: { type: 'const', value: 4 },
            operator: '='
        })
    })
    it("{db:\"employee\"}", () => {
        var data = getTestData(p => p.x == 4);
        var lam = where(data.body, data.param, {}, { db: "employee" });
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 4 },
            operator: '='
        })
    })
    /*
    it("p=>[1].includes(p.x)", () => {
        var data = getTestData(p => [1].includes(p.x));

        assert(where(data.body, data.param, {}));
    })*/
});
describe("表达式测试", () => {
    it("p=>[1,2,3].includes(p.x)", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: {
                type: 'array', value: [{
                    type: "const",
                    value: 1
                }, {
                    type: "const",
                    value: 2
                }, {
                    type: "const",
                    value: 3
                }]
            },
            operator: 'in'
        })
    })
    it("p=>![1,2,3].includes(p.x)", () => {
        var data = getTestData(p => ![1, 2, 3].includes(p.x));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: {
                        type: 'array', value: [{
                            type: "const",
                            value: 1
                        }, {
                            type: "const",
                            value: 2
                        }, {
                            type: "const",
                            value: 3
                        }]
                    },
                    operator: 'in'
                }
            },
            operator: 'not'
        })
    })
    it("p=>[1,2,3].includes(p.x)&&p.y==4", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x) && p.y == 4);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: {
                        type: 'array', value: [{
                            type: "const",
                            value: 1
                        }, {
                            type: "const",
                            value: 2
                        }, {
                            type: "const",
                            value: 3
                        }]
                    },
                    operator: 'in'
                }
            },
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`y`' },
                    right: { type: 'const', value: 4 },
                    operator: '='
                }
            },
            operator: "and"
        })
    })
    it("p=>[1,2,3].includes(p.x)==true", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x) == true);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: {
                        type: 'array', value: [{
                            type: "const",
                            value: 1
                        }, {
                            type: "const",
                            value: 2
                        }, {
                            type: "const",
                            value: 3
                        }]
                    },
                    operator: 'in'
                }
            },
            right: { type: 'const', value: true },
            operator: '='
        })
    })
    it("p=>[1,2,3].includes(p.x)==false", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x) == false);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: {
                        type: 'array', value: [{
                            type: "const",
                            value: 1
                        }, {
                            type: "const",
                            value: 2
                        }, {
                            type: "const",
                            value: 3
                        }]
                    },
                    operator: 'in'
                }
            },
            right: { type: 'const', value: false },
            operator: '='
        })
    })
    it("p=>[1,2,3].includes(p.x)!=true", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x) != true);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: {
                        type: 'array', value: [{
                            type: "const",
                            value: 1
                        }, {
                            type: "const",
                            value: 2
                        }, {
                            type: "const",
                            value: 3
                        }]
                    },
                    operator: 'in'
                }
            },
            right: { type: 'const', value: true },
            operator: '<>'
        })
    })
    it("p=>[1,2,3].includes(p.x)!=false", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x) != false);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: {
                        type: 'array', value: [{
                            type: "const",
                            value: 1
                        }, {
                            type: "const",
                            value: 2
                        }, {
                            type: "const",
                            value: 3
                        }]
                    },
                    operator: 'in'
                }
            },
            right: { type: 'const', value: false },
            operator: '<>'
        })
    })
    it("p=>p[\"x\"]==1", () => {
        var data = getTestData(p => p["x"] == 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p[y]==1", () => {
        var data = getTestData(p => p[y] == 1);
        var lam = where(data.body, data.param, {y:'x'}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x==1", () => {
        var data = getTestData(p => p.x == 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x!=1", () => {
        var data = getTestData(p => p.x != 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '<>'
        })
    })
    it("p=>p.x===1", () => {
        var data = getTestData(p => p.x === 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x!==1", () => {
        var data = getTestData(p => p.x !== 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '<>'
        })
    })
    it("p=>p.x>1", () => {
        var data = getTestData(p => p.x > 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '>'
        })
    })
    it("p=>p.x>=1", () => {
        var data = getTestData(p => p.x >= 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '>='
        })
    })
    it("p=>p.x<1", () => {
        var data = getTestData(p => p.x < 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '<'
        })
    })
    it("p=>p.x<=1", () => {
        var data = getTestData(p => p.x <= 1);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: 1 },
            operator: '<='
        })
    })
    it("p=>p.x+1==2", () => {
        var data = getTestData(p => p.x + 1 == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '+'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x-1==2", () => {
        var data = getTestData(p => p.x - 1 == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '-'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x*1==2", () => {
        var data = getTestData(p => p.x * 1 == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '*'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x/1==2", () => {
        var data = getTestData(p => p.x / 1 == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '/'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x%1==2", () => {
        var data = getTestData(p => p.x % 1 == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '%'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x-p.y==2", () => {
        var data = getTestData(p => p.x - p.y == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'field', value: '`y`' },
                    operator: '-'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x--==2", () => {
        var data = getTestData(p => p.x-- == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '-'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x++==2", () => {
        var data = getTestData(p => p.x++ == 2);
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '+'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x.indexOf(\"abc\")", () => {
        var data = getTestData(p => p.x.indexOf("abc"));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: "%abc%" },
            operator: 'like'
        })
    })
    it("p=>!p.x.indexOf(\"abc\")", () => {
        var data = getTestData(p => !p.x.indexOf("abc"));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: "%abc%" },
                    operator: 'like'
                }
            },
            operator: 'not'
        })
    })
    it("p=>p.x.startsWith(\"abc\")", () => {
        var data = getTestData(p => p.x.startsWith("abc"));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: "abc%" },
            operator: 'like'
        })
    })
    it("p=>!p.x.startsWith(\"abc\")", () => {
        var data = getTestData(p => !p.x.startsWith("abc"));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: "abc%" },
                    operator: 'like'
                }
            },
            operator: 'not'
        })
    })
    it("p=>p.x.endsWith(\"abc\")", () => {
        var data = getTestData(p => p.x.endsWith("abc"));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`x`' },
            right: { type: 'const', value: "%abc" },
            operator: 'like'
        })
    })
    it("p=>!p.x.endsWith(\"abc\")", () => {
        var data = getTestData(p => !p.x.endsWith("abc"));
        var lam = where(data.body, data.param, {}, {});
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: "%abc" },
                    operator: 'like'
                }
            },
            operator: 'not'
        })
    })
    it("p=>p.x==1&&p.y==2", () => {
        var data = getTestData(p => p.x == 1 && p.y == 2);
        var lam = where(data.body, data.param, {}, {});
        //console.log(lam)
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`x`' }
                    , right: { type: 'const', value: 1 }
                    , operator: '='
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`y`' }
                    , right: { type: 'const', value: 2 }
                    , operator: '='
                }
            },
            operator: 'and'
        })
    })
    it("p=>p.x==1||p.y==2", () => {
        var data = getTestData(p => p.x == 1 || p.y == 2);
        var lam = where(data.body, data.param, {}, {});
        //console.log(lam)
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`x`' }
                    , right: { type: 'const', value: 1 }
                    , operator: '='
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`y`' }
                    , right: { type: 'const', value: 2 }
                    , operator: '='
                }
            },
            operator: 'or'
        })
    })
    it("p=>p.x==1||p.y==2||p.z==3", () => {
        var data = getTestData(p => p.x == 1 || p.y == 2 || p.z == 3);
        var lam = where(data.body, data.param, {}, {});
        //console.log(lam)
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`x`' },
                            right: { type: 'const', value: 1 },
                            operator: "="
                        }
                    }
                    , right: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`y`' },
                            right: { type: 'const', value: 2 },
                            operator: "="
                        }
                    }
                    , operator: 'or'
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`z`' }
                    , right: { type: 'const', value: 3 }
                    , operator: '='
                }
            },
            operator: 'or'
        })
    })
    it("p=>p.x==1&&p.y==2||p.z==3", () => {
        var data = getTestData(p => p.x == 1 && p.y == 2 || p.z == 3);
        var lam = where(data.body, data.param, {}, {});
        //console.log(JSON.stringify(lam,null,4));
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`x`' },
                            right: { type: 'const', value: 1 },
                            operator: "="
                        }
                    }
                    , right: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`y`' },
                            right: { type: 'const', value: 2 },
                            operator: "="
                        }
                    }
                    , operator: 'and'
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`z`' }
                    , right: { type: 'const', value: 3 }
                    , operator: '='
                }
            },
            operator: 'or'
        })
    })
    it("p=>p.x==1&&(p.y==2||p.z==3)", () => {
        var data = getTestData(p => p.x == 1 && (p.y == 2 || p.z == 3));
        var lam = where(data.body, data.param, {}, {});
        //console.log(JSON.stringify(lam,null,4));
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`x`' },
                    right: { type: 'const', value: 1 },
                    operator: "="
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`y`' },
                            right: { type: 'const', value: 2 },
                            operator: "="
                        }
                    }
                    , right: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`z`' },
                            right: { type: 'const', value: 3 },
                            operator: "="
                        }
                    }
                    , operator: 'or'
                }
            },
            operator: 'and'
        })
    })
});