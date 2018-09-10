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
var list = [1, 2, 3];
var data = getTestData(p => p.x.startsWith("a"));
var lam = where(data.body, data.param, { list }, [{ value: 'table', parent: { value: 'db' } }]);
console.log(JSON.stringify(lam,null,4));
