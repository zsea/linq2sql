
# 项目介绍

Linq语法基础库，用于支持数据库操作。

# 快速开始

## 安装

```
npm install --save linq2sql acorn
```

## 使用

```javascript
var expression=require("linq2sql"),acorn = require("acorn");
function getEntry(expressionTree) {
    var ast = acorn.parse(expressionTree.toString());
    var statement = ast.body[0];
    if (statement.type != "ExpressionStatement") {
        throw new Error("not support ExpressionStatement");
    }
    statement = statement.expression;
    if (statement.type != "ArrowFunctionExpression") {
        throw new Error("not support ArrowFunctionExpression");
    }
    var params = statement.params;
    var body = statement.body;
    return {
        body: body,
        params: params
    }
}
var lambda=p=>p.x=1;
var data=getEntry(lambda);
var sqlTree = expression(data.body, data.params, {}, [{ value: 'table', parent: { value: 'db' } }]);
```
由此，我们可以得到一个SQL表达式对象；根据SQL表达式对象，我们可以解析为不同的数据库支持语法。

# 接口介绍

## expression

表达式解析入口，仅接收**ArrowFunctionExpression**类型的表达式，参数入下：

* **body** ArrowFunctionExpression类型的表达式。
* **params** ```Array```，表达式入参列表，与数据库表一一对应，该值来源于lambda表达式的函数入参列表。
* **consts** ```Object```，表达式中所使用的外部变量。
* **dbinfo** ```Array```，数据库信息，与参数```params```的顺序一一对应。

### 参数详细说明

#### body

用户传入的原始表达式一般为```p=>p.x==1```，解析后的原始表达式不能直接做为参数传入，需再次分析后，取ArrowFunctionExpression类型的表达式，可参考开始章节示例。

支持的表达式类型请参考[测试文件](./test/expression.js)。

#### params

表达式的入参列表，参考开始章节示例。

#### consts

表达式中所使用的外部变量列表，如表达式```p=>p.x+y==1```，其中的```y```需要通过```consts```传入。
参数示例：
```
{
    y:2
}
```
#### dbinfo

数据库信息。表达式中的入参需要解析为数据库字段信息，此参数可传入数据库的完整信息，多个参数表示多个数据库支持。也可支持数据库别名。

通过级联的方式支持表与库的信息。示例：

```
{ value: 'table', parent: { value: 'db' } }    
```

开始层级为数据库表一级，通过```parent```属性指定上一级的信息。

## expression.formater

数据库转义函数。默认为mysql支持的格式：
```javascript
expression.formater=function(field){
    return "`" + field + "`";  
}
```
## expression.entity

把一个```Object```对象换为SQL表达式对象示，一般用于insert或update语句，特殊处理后也可用于where语句。

参数列表：

* **obj** ```Object```需要转换的对象。
* **dbinfo** ```Object```数据库对象，参考上一章节中数据库对象的描述。

obj中的key会和数据库的信息进行整合，组合成一个完成的字段信息。

示例：
```javascript
expression.entity({a:1},{ value: 'table', parent: { value: 'db' } }  )
```
返回值示例：
```javascript
[{
    left:{type:"field",value:"`db`.`table`.`a`"},
    right:{type:"const",value:1},
    operator:"set"
}]
```
## expression.spliter

数据库分隔符，默认为```.```。

# 返回值描述

返回一个数组或者一个Object对象，数组中的单个元素含义与单个Ojbect相同。

Object对象共分两总：

1. 包含属性```left```,```right```,```operator```；
2. 包含属性```type```,```value```；

## 情况一

一般是一个完整的条件，如```a=1```，其中left=a,operator='=',right=1。left和right的具体内容可根据情况二进行解析。

支持的操作符列表：
+,-,*,/,%,like,in,set,>,<,>=,<=,=,or,and,not

> set操作符表示赋值语句，一般用于update的语句中

## 情况二

根据```type```确定```value```内容的含义。type值如下：

|type值   |含义    |
|----|----|
|field|数据库字段|
|const|常量值，一般转义后写入数据库，防止SQL注入|

# 参考资料

* [https://github.com/acornjs/acorn](https://github.com/acornjs/acorn)
* [使用 Acorn 来解析 JavaScript](https://segmentfault.com/a/1190000007473065)
* [acorn.js介绍](https://www.jianshu.com/p/8c813abd59cd)

# 辅助工具

* [https://astexplorer.net/](https://astexplorer.net/)