module.exports.rules = {
    "no-moment": context => ({
        CallExpression: function (node) {
            if (node.callee.name === "moment") {
                context.report(node, "Don't use \"moment\", use brightdates");
            }
        }
    }),
    "no-date": context => ({
        MemberExpression: function (node) {
            if (node.object.name === "Date") {
                context.report(node, "Don't use \"Date\", use brightdates");
            }
        },
        CallExpression: function (node) {
            if (node.callee.name === "Date") {
                context.report(node, "Don't use \"Date\", use brightdates");
            }
        }
    }),
    "no-new-date": context => ({
        NewExpression: function (node) {
            if (node.callee.name === "Date") {
                context.report(node, "Don't use \"new Date\", use brightdates");
            }
        }
    })
};