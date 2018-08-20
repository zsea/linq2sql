const assert = require('power-assert');
const expression=require("../lib/expression");
console.log(expression);

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

describe("简单测试", () => {


    it("p=>p.x==4", () => {
        var data=getTestData(p=>p.x==4);

        assert(expression(data.body,data.param,{}));
    })
    it("p=>[1].includes(p.x)", () => {
        var data=getTestData(p=>[1].includes(p.x));

        assert(expression(data.body,data.param,{}));
    })
})