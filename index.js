const where = require("./lib/where");
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
//p.x.indexOf("abc")
var data = getTestData(p => ![1,2,3].includes(p.x));
var lam = where(data.body, data.param, {}, {});
console.log(lam);

