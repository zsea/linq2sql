function dbField(db) {
    if (!db) {
        throw new ReferenceError('db is null or undefined.');
    }
    if (!db.value) {
        throw new ReferenceError('not found field value');
    }
    if (!db.parent) {
        return dbFormat(db.value);
    }
    var parent = dbField(db.parent);
    if (parent) {
        return [parent, dbFormat(db.value)].join(".");
    }
    return dbFormat(db.value);
    //return "`" + db.value + "`." + "`" + dbFormat(db.parent) + "`"
}

function _dbFormat(field, dbinfo) {
    return dbField({
        parent: dbinfo,
        value: field
    })
}

/**
 * 此方法可暴露到外部由用户设置以支持多数据库
 * @param {*} field - 需要处理数据库字段名转义的数据
 */
function dbFormat(field) {
    return "`" + field + "`";
}
//var db = "aaa", table = "test";
const ExpressionHandler = {};
ExpressionHandler["MemberExpression"] = function (body, params, consts, dbinfo) {

    var name = expression(body.object, params, consts, dbinfo);
    switch (name.type) {
        case "array":
        case "field": {
            return name;
        }
        case "var": {
            let params_index = -1;
            for (let i = 0; i < params.length; i++) {
                if (params[i].name == name.value) {
                    params_index = i;
                    break;
                }
            }
            if (params_index == -1) {
                throw new Error(`variable '${name.value}' not exists.`);
            }
            var v_db = dbinfo[params_index];
            if (!v_db) {
                throw new RangeError(`not found db of variable '${name.value}'`)
            }
            var field = expression(body.property, params, consts, dbinfo);
            return {
                type: "field",
                value: _dbFormat(field.value, v_db)
            };
        }
        default: {
            throw new Error("not support member type:" + name.type);
        }
    }
}
ExpressionHandler["Identifier"] = function (body, params, consts, dbinfo) {
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
ExpressionHandler["Literal"] = function (body, params, consts, dbinfo) {

    return {
        type: "const",
        value: body.value
    };
}
ExpressionHandler["BinaryExpression"] = ExpressionHandler["LogicalExpression"] = function (body, params, consts, dbinfo) {
    var left = expression(body.left, params, consts, dbinfo);
    var right = expression(body.right, params, consts, dbinfo);
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
ExpressionHandler["CallExpression"] = function (body, params, consts, dbinfo) {
    var property = expression(body.callee.property, params, consts, dbinfo);
    var callee = expression(body.callee, params, consts, dbinfo);
    switch (property.value) {
        case "indexOf": {
            if (callee.type == "field") {
                var arg = expression(body.arguments[0], params, consts, dbinfo);
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
            var arg = expression(body.arguments[0], params, consts, dbinfo);
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
            var arg = expression(body.arguments[0], params, consts, dbinfo);
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
            var arg = expression(body.arguments[0], params, consts, dbinfo);
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
ExpressionHandler["ArrayExpression"] = function (body, params, consts, dbinfo) {
    var elements = [];
    for (var i = 0; i < body.elements.length; i++) {
        let item = expression(body.elements[i], params, consts, dbinfo);
        elements.push(item)
    }
    return {
        type: "array",
        value: elements
    };
}
ExpressionHandler["UpdateExpression"] = function (body, params, consts, dbinfo) {
    var operator = body.operator;
    var arg = expression(body.argument, params, consts, dbinfo);
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
ExpressionHandler["UnaryExpression"] = function (body, params, consts, dbinfo) {
    var operator = body.operator;
    var right = expression(body.argument, params, consts, dbinfo)
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
function expression(body, params, consts, dbinfo) {
    var handler = ExpressionHandler[body.type];
    if (!handler) {
        throw new Error("not support " + body.type);
    }
    return handler(body, params, consts, dbinfo || []);
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
    var params = statement.paramss[0];
    var body = statement.body;
    if (body.type !== "BinaryExpression" && body.type !== "LogicalExpression") {
        throw new Error("only support BinaryExpression or LogicalExpression");
    }
    var sql = expression(body, params, consts);
    console.log(sql);
    //console.log(ast);
}
***/

module.exports = expression;