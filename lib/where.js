function dbFormat(field, dbinfo) {
    var value = [];
    if (dbinfo.db && dbinfo.table) {
        value.push("`" + dbinfo.db + "`")
    }
    if (dbinfo.table) {
        value.push("`" + dbinfo.table + "`")
    }
    value.push("`" + field + "`")
    return value.join(".");
}
//var db = "aaa", table = "test";
const ExpressionHandler = {};
ExpressionHandler["MemberExpression"] = function (body, param, consts, dbinfo) {

    var name = expression(body.object, param, consts, dbinfo);
    switch (name.type) {
        case "array":
        case "field": {
            return name;
        }
        default: {
            name = name.value;
            if (name == param.name) {
                var field = expression(body.property, param, consts, dbinfo);
                return {
                    type: "field",
                    value: dbFormat(field.value, dbinfo)
                };
            }
            throw new Error("only support const");
        }
    }
}
ExpressionHandler["Identifier"] = function (body, param, consts, dbinfo) {
    if (consts && body.name in consts) {
        return {
            type: "const",
            value: consts[body.name]
        }
    }
    //console.log("字段名", body.name)
    return {
        type: "var",
        value: body.name
    };
}
ExpressionHandler["Literal"] = function (body, param, consts, dbinfo) {

    return {
        type: "const",
        value: body.value
    };
}
ExpressionHandler["BinaryExpression"] = ExpressionHandler["LogicalExpression"] = function (body, param, consts, dbinfo) {
    var left = expression(body.left, param, consts, dbinfo);
    var right = expression(body.right, param, consts, dbinfo);
    if (!left.type) {
        left = {
            type: "expression",
            value: left
        }
    }
    if (!right.type) {
        right = {
            type: "expression",
            value: right
        }
    }
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
        case "+": {
            operator = "+";
            break;
        }
        case "-": {
            operator = "-";
            break;
        }
        case "*": {
            operator = "*";
            break;
        }
        case "/": {
            operator = "/";
            break;
        }
        case "%": {
            operator = "%";
            break;
        }
        default: {
            throw new Error("not support " + body.operator)
        }
    }
    return {
        left,
        right,
        operator
    };
}
ExpressionHandler["CallExpression"] = function (body, param, consts, dbinfo) {
    var property = expression(body.callee.property, param, consts, dbinfo);
    var callee = expression(body.callee, param, consts, dbinfo);
    switch (property.value) {
        case "indexOf": {
            if (callee.type == "field") {
                var arg = expression(body.arguments[0], param, consts, dbinfo);
                if (arg.type == "const") {
                    arg.value = "%" + arg.value + "%"
                    return {
                        left: callee,
                        right: arg,
                        operator: "like"
                    }
                }
                break;
            }
            break;
        }
        case "includes": {
            var arg = expression(body.arguments[0], param, consts, dbinfo);
            if (arg.type == "field") {
                return {
                    left: { type: 'field', value: arg.value },
                    right: callee,
                    operator: "in"
                }
            }
            break;
        }

        case "startsWith": {
            var arg = expression(body.arguments[0], param, consts, dbinfo);
            if (arg.type == "const") {
                arg.value = arg.value + "%"
                return {
                    left: callee,
                    right: arg,
                    operator: "like"
                }
            }
            break;
        }
        case "endsWith": {
            var arg = expression(body.arguments[0], param, consts, dbinfo);
            if (arg.type == "const") {
                arg.value = "%" + arg.value
                return {
                    left: callee,
                    right: arg,
                    operator: "like"
                }
            }
            break;
        }
    }
    throw new Error("not support CallExpression:" + callee.type);
}
ExpressionHandler["ArrayExpression"] = function (body, param, consts, dbinfo) {
    var elements = [];
    for (var i = 0; i < body.elements.length; i++) {
        let item = expression(body.elements[i], param, consts, dbinfo);
        elements.push(item)
    }
    return {
        type: "array",
        value: elements
    };
}
ExpressionHandler["UpdateExpression"] = function (body, param, consts, dbinfo) {
    var operator = body.operator;
    var arg = expression(body.argument, param, consts, dbinfo);
    switch (operator) {
        case "++": {
            operator = "+";
            break;
        }
        case "--": {
            operator = "-";
            break;
        }
        default: {
            throw new Error("not support operator" + operator);
        }
    }
    return {
        left: { type: 'field', value: arg.value },
        right: { type: 'const', value: 1 },
        operator: operator
    }
}
ExpressionHandler["UnaryExpression"] = function (body, param, consts, dbinfo) {
    var operator = body.operator;
    var right = expression(body.argument, param, consts, dbinfo)
    switch (operator) {
        case "!": {
            return {
                left: null,
                right: {
                    type: "expression",
                    value: right
                },
                operator: "not"
            }
        }
    }
    throw new Error("not support UnaryExpression:" + operator);
}
function expression(body, param, consts, dbinfo) {
    var handler = ExpressionHandler[body.type];
    if (!handler) {
        throw new Error("not support " + body.type);
    }
    return handler(body, param, consts, dbinfo || {});
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