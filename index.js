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
    var param = statement.params;
    var body = statement.body;
    return {
        body: body,
        param: param
    }
}
//p.x.indexOf("abc")
var data = getTestData(p => "abc".includes(p.x));
var lam = where(data.body, data.param, {}, [{ value: 'table', parent: { value: 'db' } }]);
console.log(lam);

