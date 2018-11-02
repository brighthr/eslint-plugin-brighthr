/**
 * Test Workbench
 * https://astexplorer.net/#/gist/1d1efc9443a16f3d13540cf57d35db24/675cbaf4d914ac0022b1a6b353a0d70c6c659e69
 */
let identifiers = {};
let styledComponents = [];

const componentUsed = name => {
	if (!identifiers[name]) {
		identifiers[name] = {};
	}
	// eslint-disable-next-line no-prototype-builtins
	if (identifiers.hasOwnProperty(name)) {
		identifiers[name].used = true;
	}
};

function flatten(arr) {
	return Array.prototype.concat(...arr);
}

const traverseHOC = (node) => {
	let args = [];
	let callees = [];

	if (node.arguments) {
		args = flatten(node.arguments.map(arg => traverseHOC(arg)));
	}

	if (node.callee) {
		callees = flatten(traverseHOC(node.callee))
	}

	if (node.name) {
		return args.concat(callees, [node.name])
	}

	return args.concat(callees)
}

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
			if (node.parent && node.parent.type === 'ImportSpecifier') {
				identifiers[node.name] = {
					node
				};
			}

			if (node.parent && node.parent.type === 'ReturnStatement') {
				componentUsed(node.name);
			}
		},
		JSXOpeningElement(node) {
			componentUsed(node.name.name);
		},
		ExportNamedDeclaration(node) {
			node.specifiers.forEach(function (specifier) {
				componentUsed(specifier.local.name);
			});
		},
		ExportDefaultDeclaration(node) {
			if (node.declaration.name) {
				componentUsed(node.declaration.name);
			} else if (node.declaration.type === 'CallExpression') {
				// HOC style callback e:g: inject('store')(observer(Component))
				traverseHOC(node.declaration).forEach(function (name) {
					componentUsed(name);
				});
			}
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
	}),
	'styled-component-display-name-not-set': context => ({
		VariableDeclarator(node) {
			if (
				node.init &&
				node.init.type === 'TaggedTemplateExpression' &&
				node.init.tag
			) {
				if (
					node.init.tag.type === 'CallExpression' &&
					node.init.tag.callee.name === 'styled'
				) {
					// match const x = styled(MyComponent)`color: black`;
					styledComponents.push(node);
				} else if (
					node.init.tag.type === 'MemberExpression' &&
					node.init.tag.object.type === 'Identifier' &&
					node.init.tag.object.name === 'styled'
				) {
					// match const x = styled.div`color: black`;
					styledComponents.push(node);
				}
			}
		},
		'Program:exit': function exit() {
			styledComponents.forEach(node => {
				const usages = context.getDeclaredVariables(node);
				const isDisplayNameDefined = usages.some(usage =>
					usage.references.find(
						ref =>
							ref.identifier.type === 'Identifier' &&
							ref.identifier.parent &&
							ref.identifier.parent.type === 'MemberExpression' &&
							ref.identifier.parent.parent &&
							ref.identifier.parent.parent.type ===
								'AssignmentExpression' &&
							ref.identifier.parent.parent.operator === '=' &&
							ref.identifier.parent.property.type ===
								'Identifier' &&
							ref.identifier.parent.property.name ===
								'displayName'
					)
				);

				if (!isDisplayNameDefined) {
					context.report({
						node,
						message: `DisplayName for styled component ${
							node.id.name
						} is not defined`,
						data: {
							component: node.id.name
						},
						fix(fixer) {
							return fixer.insertTextAfter(
								node,
								`\n${node.id.name}.displayName = '${
									node.id.name
								};'`
							);
						}
					});
				}
			});
			styledComponents = [];
		}
	})
};
