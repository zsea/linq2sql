function dbFormat(f) {
    return "`" + f + "`";
}
var db = "aaa", table = "test";
const ExpressionHandler = {};
ExpressionHandler["MemberExpression"] = function (body, param, consts) {

    
    var name = expression(body.object, param,consts);
    if (name == param.name) {
        var field = expression(body.property, param, consts);
        return `${dbFormat(db)}.${dbFormat(table)}.${dbFormat(field)}`;
    }
    throw new Error("only support const");
}
ExpressionHandler["Identifier"] = function (body, param, consts) {

    /***
     * 需要处理变量占位符
     */
    if (consts && body.name in consts) return consts[body.name];
    return body.name;
}
ExpressionHandler["Literal"] = function (body, param) {
    /***
     * 需要处理变量占位符
     */
    return body.value;
}
ExpressionHandler["BinaryExpression"] = ExpressionHandler["LogicalExpression"] = function (body, param, consts) {
    var left = expression(body.left, param, consts);
    var right = expression(body.right, param, consts);
    var operator = null;
    switch (body.operator) {
        case "==":
        case "===": {
            operator = "=";
            break;
        }
        case "!=":
        case "!==": {
            operator = "<>";
            break;
        }
        case ">": {
            operator = ">";
            break;
        }
        case "<": {
            operator = "<";
            break;
        }
        case "<=": {
            operator = "<=";
            break;
        }
        case ">=": {
            operator = ">=";
            break;
        }
        case "||": {
            operator = "or";
            break;
        }
        case "&&": {
            operator = "and";
            break;
        }
        default: {
            throw new Error("not support " + body.operator)
        }
    }
    return `(${left}) ${operator} (${right})`;
}
ExpressionHandler["CallExpression"]=function(body, param, consts){
    var callee=body.callee;
}
ExpressionHandler["ArrayExpression"]=function(body,param,consts){
    var elements=[];
    for(var i=0;i<body.elements.length;i++){
        let item=expression(body.elements[i],param,consts);
        elements.push(item)
    }
    return elements;
}

function expression(body, param, consts) {
    var handler = ExpressionHandler[body.type];
    if (!handler) {
        throw new Error("not support " + body.type);
    }
    return handler(body, param, consts);
}
/***
var x = function (m, consts) {
    var code = m.toString();
    var ast = acorn.parse(code);
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
    if (body.type !== "BinaryExpression" && body.type !== "LogicalExpression") {
        throw new Error("only support BinaryExpression or LogicalExpression");
    }
    var sql = expression(body, param, consts);
    console.log(sql);
    //console.log(ast);
}
***/

module.exports = expression;