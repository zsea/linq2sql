const assert = require('power-assert');
const where = require("../lib/expression");
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
    var param = statement.params;
    var body = statement.body;
    return {
        body: body,
        param: param
    }
}

describe("数据库信息测试", () => {
    it("[{value:'table',parent:{value:'db'}}]", () => {
        var data = getTestData(p => p.x == 4);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 4 },
            operator: '='
        })
    })
    it("数据库字段转义", () => {
        var data = getTestData(p => p.x == 4);
        var format = where.formater;
        where.formater = function (field) {
            return `[${field}]`
        };
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '[db].[table].[x]' },
            right: { type: 'const', value: 4 },
            operator: '='
        });
        where.formater = format;
    })
    it("数据库字段分隔符", () => {
        var data = getTestData(p => p.x == 4);
        where.spliter = "/"
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`/`table`/`x`' },
            right: { type: 'const', value: 4 },
            operator: '='
        });
        where.spliter = "."
    })
    /*
    it("p=>[1].includes(p.x)", () => {
        var data = getTestData(p => [1].includes(p.x));

        assert(where(data.body, data.param, {}));
    })*/
});

describe("单数据库表达式测试", () => {
    it("p=>[1,2,3].includes(p.x)", () => {
        var list = [1, 2, 3]
        var data = getTestData(p => list.includes(p.x));
        var lam = where(data.body, data.param, { list }, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
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
    it("p=>[1,2,3].includes(p.x)", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
                    left: { type: 'field', value: '`db`.`table`.`y`' },
                    right: { type: 'const', value: 4 },
                    operator: '='
                }
            },
            operator: "and"
        })
    })
    it("p=>[1,2,3].includes(p.x)==true", () => {
        var data = getTestData(p => [1, 2, 3].includes(p.x) == true);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p[y]==1", () => {
        var data = getTestData(p => p[y] == 1);
        var lam = where(data.body, data.param, { y: 'x' }, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x==x", () => {
        var data = getTestData(p => p.x == x);
        var lam = where(data.body, data.param, { x:1 }, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x==1", () => {
        var data = getTestData(p => p.x == 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x!=1", () => {
        var data = getTestData(p => p.x != 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '<>'
        })
    })
    it("p=>p.x===1", () => {
        var data = getTestData(p => p.x === 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '='
        })
    })
    it("p=>p.x!==1", () => {
        var data = getTestData(p => p.x !== 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '<>'
        })
    })
    it("p=>p.x>1", () => {
        var data = getTestData(p => p.x > 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '>'
        })
    })
    it("p=>p.x>=1", () => {
        var data = getTestData(p => p.x >= 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '>='
        })
    })
    it("p=>p.x<1", () => {
        var data = getTestData(p => p.x < 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '<'
        })
    })
    it("p=>p.x<=1", () => {
        var data = getTestData(p => p.x <= 1);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: 1 },
            operator: '<='
        })
    })
    it("p=>p.x+1==2", () => {
        var data = getTestData(p => p.x + 1 == 2);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
                    right: { type: 'field', value: '`db`.`table`.`y`' },
                    operator: '-'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x--==2", () => {
        var data = getTestData(p => p.x-- == 2);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
                    right: { type: 'const', value: 1 },
                    operator: '+'
                }
            },
            right: { type: 'const', value: 2 },
            operator: '='
        })
    })
    it("p=>p.x.includes(\"abc\")", () => {
        var data = getTestData(p => p.x.includes("abc"));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: "%abc%" },
            operator: 'like'
        })
    })
    it("p=>!p.x.includes(\"abc\")", () => {
        var data = getTestData(p => !p.x.includes("abc"));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
                    right: { type: 'const', value: "%abc%" },
                    operator: 'like'
                }
            },
            operator: 'not'
        })
    })
    it("p=>p.x.startsWith(\"abc\")", () => {
        var data = getTestData(p => p.x.startsWith("abc"));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: "abc%" },
            operator: 'like'
        })
    })
    it("p=>!p.x.startsWith(\"abc\")", () => {
        var data = getTestData(p => !p.x.startsWith("abc"));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
                    right: { type: 'const', value: "abc%" },
                    operator: 'like'
                }
            },
            operator: 'not'
        })
    })
    it("p=>p.x.endsWith(\"abc\")", () => {
        var data = getTestData(p => p.x.endsWith("abc"));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`table`.`x`' },
            right: { type: 'const', value: "%abc" },
            operator: 'like'
        })
    })
    it("p=>!p.x.endsWith(\"abc\")", () => {
        var data = getTestData(p => !p.x.endsWith("abc"));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: null,
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
                    right: { type: 'const', value: "%abc" },
                    operator: 'like'
                }
            },
            operator: 'not'
        })
    })
    it("p=>p.x==1&&p.y==2", () => {
        var data = getTestData(p => p.x == 1 && p.y == 2);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        //console.log(lam)
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' }
                    , right: { type: 'const', value: 1 }
                    , operator: '='
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`db`.`table`.`y`' }
                    , right: { type: 'const', value: 2 }
                    , operator: '='
                }
            },
            operator: 'and'
        })
    })
    it("p=>p.x==1||p.y==2", () => {
        var data = getTestData(p => p.x == 1 || p.y == 2);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        //console.log(lam)
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' }
                    , right: { type: 'const', value: 1 }
                    , operator: '='
                }
            },
            right:
            {
                type: 'expression',
                value: {
                    left: { type: 'field', value: '`db`.`table`.`y`' }
                    , right: { type: 'const', value: 2 }
                    , operator: '='
                }
            },
            operator: 'or'
        })
    })
    it("p=>p.x==1||p.y==2||p.z==3", () => {
        var data = getTestData(p => p.x == 1 || p.y == 2 || p.z == 3);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        //console.log(lam)
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`db`.`table`.`x`' },
                            right: { type: 'const', value: 1 },
                            operator: "="
                        }
                    }
                    , right: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`db`.`table`.`y`' },
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
                    left: { type: 'field', value: '`db`.`table`.`z`' }
                    , right: { type: 'const', value: 3 }
                    , operator: '='
                }
            },
            operator: 'or'
        })
    })
    it("p=>p.x==1&&p.y==2||p.z==3", () => {
        var data = getTestData(p => p.x == 1 && p.y == 2 || p.z == 3);
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        //console.log(JSON.stringify(lam,null,4));
        assert.deepEqual(lam, {
            left:
            {
                type: 'expression',
                value: {
                    left: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`db`.`table`.`x`' },
                            right: { type: 'const', value: 1 },
                            operator: "="
                        }
                    }
                    , right: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`db`.`table`.`y`' },
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
                    left: { type: 'field', value: '`db`.`table`.`z`' }
                    , right: { type: 'const', value: 3 }
                    , operator: '='
                }
            },
            operator: 'or'
        })
    })
    it("p=>p.x==1&&(p.y==2||p.z==3)", () => {
        var data = getTestData(p => p.x == 1 && (p.y == 2 || p.z == 3));
        var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
        //console.log(JSON.stringify(lam,null,4));
        assert.deepEqual(lam, {
            left: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`table`.`x`' },
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
                            left: { type: 'field', value: '`db`.`table`.`y`' },
                            right: { type: 'const', value: 2 },
                            operator: "="
                        }
                    }
                    , right: {
                        type: "expression",
                        value: {
                            left: { type: 'field', value: '`db`.`table`.`z`' },
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
describe("多数据库表达式测试", () => {
    it("(p,q)=>p.x==q.x", () => {
        var data = getTestData((p, q) => p.x == q.x);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: { type: 'field', value: '`db`.`tbq`.`x`' },
            operator: '='
        })
    })
    it("(p,q)=>p.x==q.x", () => {
        var data = getTestData((p, q) => p.x == q.x);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'dbq' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: { type: 'field', value: '`dbq`.`tbq`.`x`' },
            operator: '='
        })
    })
})
describe("赋值表达式测试", () => {
    it("p=>{p.y=2,p.x=1}", () => {
        var data = getTestData(p => { p.x = 1, p.y = 2 });
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, [{
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: { type: 'const', value: 1 },
            operator: 'set'
        },
        {
            left: { type: 'field', value: '`db`.`tbp`.`y`' },
            right: { type: 'const', value: 2 },
            operator: 'set'
        }])
    })
    it("p=>{p.y++}", () => {
        var data = getTestData(p => { p.y++ });
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`y`' },
            right: { type: 'const', value: 1 },
            operator: '+'
        })
    })
    it("{ x:1, y:2, z:3 }", () => {
        var lam = where.entity({ x: 1, y: 2, z: 3 }, { value: 'tbp', parent: { value: 'db' } })
        assert.deepEqual(lam, [{
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: { type: 'const', value: 1 },
            operator: 'set'
        },
        {
            left: { type: 'field', value: '`db`.`tbp`.`y`' },
            right: { type: 'const', value: 2 },
            operator: 'set'
        },
        {
            left: { type: 'field', value: '`db`.`tbp`.`z`' },
            right: { type: 'const', value: 3 },
            operator: 'set'
        }])
    })
    it("p=>p.x+=3", () => {
        var data = getTestData(p => p.x += 3);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`tbp`.`x`' },
                    right: { type: 'const', value: 3 },
                    operator: "+"
                }
            },
            operator: 'set'
        })
    })
    it("p=>p.x-=3", () => {
        var data = getTestData(p => p.x -= 3);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`tbp`.`x`' },
                    right: { type: 'const', value: 3 },
                    operator: "-"
                }
            },
            operator: 'set'
        })
    })
    it("p=>p.x*=3", () => {
        var data = getTestData(p => p.x *= 3);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`tbp`.`x`' },
                    right: { type: 'const', value: 3 },
                    operator: "*"
                }
            },
            operator: 'set'
        })
    })
    it("p=>p.x/=3", () => {
        var data = getTestData(p => p.x /= 3);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`tbp`.`x`' },
                    right: { type: 'const', value: 3 },
                    operator: "/"
                }
            },
            operator: 'set'
        })
    })
    it("p=>p.x%=3", () => {
        var data = getTestData(p => p.x %= 3);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, {
            left: { type: 'field', value: '`db`.`tbp`.`x`' },
            right: {
                type: "expression",
                value: {
                    left: { type: 'field', value: '`db`.`tbp`.`x`' },
                    right: { type: 'const', value: 3 },
                    operator: "%"
                }
            },
            operator: 'set'
        })
    })
    it("单属性实体对象转换", () => {
        var lam = where.entity({ a: 1 }, { value: 'table', parent: { value: 'db' } });
        assert.deepEqual(lam, [{
            left: { type: "field", value: "`db`.`table`.`a`" },
            right: { type: "const", value: 1 },
            operator: "set"
        }])
    })
    it("多属性实体对象转换", () => {
        var lam = where.entity({ a: 1, b: 2 }, { value: 'table', parent: { value: 'db' } });
        assert.deepEqual(lam, [{
            left: { type: "field", value: "`db`.`table`.`a`" },
            right: { type: "const", value: 1 },
            operator: "set"
        }, {
            left: { type: "field", value: "`db`.`table`.`b`" },
            right: { type: "const", value: 2 },
            operator: "set"
        }])
    })
})
describe("取字段名测试，用于排序分组等", () => {
    it("p=>p.x", () => {
        var data = getTestData(p => p.x);
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, { type: 'field', value: '`db`.`tbp`.`x`' })
    })
    it("p=>{p.x}", () => {
        var data = getTestData(p => { p.x });
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, { type: 'field', value: '`db`.`tbp`.`x`' })
    })
    it("p=>{p.x,p.y}", () => {
        var data = getTestData(p => { p.x, p.y });
        var lam = where(data.body, data.param, {}, [{ value: 'tbp', parent: { value: 'db' } }, { value: 'tbq', parent: { value: 'db' } }]);
        assert.deepEqual(lam, [{ type: 'field', value: '`db`.`tbp`.`x`' }, { type: 'field', value: '`db`.`tbp`.`y`' }])
    })
})