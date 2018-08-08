let identifiers = {};

const componentUsed = name => {
	if (!identifiers[name]) {
		identifiers[name] = {};
	}
	// eslint-disable-next-line no-prototype-builtins
	if (identifiers.hasOwnProperty(name)) {
		identifiers[name].used = true;
	}
};

module.exports.rules = {
	'no-moment': context => ({
		CallExpression(node) {
			if (node.callee.name === 'moment') {
				context.report(node, 'Don\'t use "moment", use brightdates');
			}
		}
	}),
	'no-date': context => ({
		MemberExpression(node) {
			if (node.object.name === 'Date') {
				context.report(node, 'Don\'t use "Date", use brightdates');
			}
		},
		CallExpression(node) {
			if (node.callee.name === 'Date') {
				context.report(node, 'Don\'t use "Date", use brightdates');
			}
		}
	}),
	'no-new-date': context => ({
		NewExpression(node) {
			if (node.callee.name === 'Date') {
				context.report(node, 'Don\'t use "new Date", use brightdates');
			}
		}
	}),
	'display-name-unused': context => ({
		VariableDeclarator(node) {
			identifiers[node.id.name] = {
				node
			};
		},
		Identifier(node) {
			if (
				node.parent.object &&
				node.parent.object.type === 'Identifier' &&
				node.name === 'displayName'
			) {
				const { name } = node.parent.object;
				// eslint-disable-next-line no-prototype-builtins
				if (identifiers.hasOwnProperty(name)) {
					identifiers[name].displayNameSet = true;
				}
			}
			if (node.parent && node.parent.type === 'ReturnStatement') {
				componentUsed(node.name);
			}
		},
		JSXOpeningElement(node) {
			componentUsed(node.name.name);
		},
		ExportDefaultDeclaration(node) {
			componentUsed(node.declaration.name);
		},
		'Program:exit': function exit() {
			Object.keys(identifiers).forEach(key => {
				if (identifiers[key].displayNameSet && !identifiers[key].used) {
					context.report({
						node: identifiers[key].node,
						message: `DisplayName ${key} is defined but variable not used`,
						data: {
							component: key
						}
					});
				}
			});
			identifiers = {};
		}
	})
};
