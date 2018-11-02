/**
 * Test Workbench
 * https://astexplorer.net/#/gist/1d1efc9443a16f3d13540cf57d35db24/675cbaf4d914ac0022b1a6b353a0d70c6c659e69
 */
let identifiers = [];
let identifiersInJSX = [];
let styledComponents = [];

const isDisplayNameDefined = identifier => {
	return identifier.type === 'Identifier' &&
		identifier.parent &&
		identifier.parent.type === 'MemberExpression' &&
		identifier.parent.parent &&
		identifier.parent.parent.type ===
		'AssignmentExpression' &&
		identifier.parent.parent.operator === '=' &&
		identifier.parent.property.type ===
		'Identifier' &&
		identifier.parent.property.name ===
		'displayName'
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
			identifiers.push(node);
		},
		JSXOpeningElement(node) {
			node.name && identifiersInJSX.push(node.name.name)
		},
		'Program:exit': function exit() {
			identifiers.forEach(node => {
				const usages = context.getDeclaredVariables(node);
				const isDisplayNameSet = usages.some(usage =>
					usage.references.find(
						ref => isDisplayNameDefined(ref.identifier)
					)
				);
				const isComponentUsedInJSX = identifiersInJSX.some(id => id === node.id.name)
				if (isDisplayNameSet && usages[0].references.length < 3 && !isComponentUsedInJSX) {
					context.report({
						node: node,
						message: `DisplayName ${node.id.name} is defined but variable not used`,
						data: {
							component: node.id.name
						}
					});
				}
			});
			identifiers = [];
			identifiersInJSX = [];
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
					/* Matches styled component declaration of type:
					  const x = styled(MyComponent)`color: black`;
					*/
					styledComponents.push(node);
				} else if (
					node.init.tag.type === 'MemberExpression' &&
					node.init.tag.object.type === 'Identifier' &&
					node.init.tag.object.name === 'styled'
				) {
					/* Matches styled component declaration of type:
					  const x = styled.div`color: black`;
					*/
					styledComponents.push(node);
				}
			}
		},
		'Program:exit': function exit() {
			styledComponents.forEach(node => {
				const usages = context.getDeclaredVariables(node);
				const isDisplayNameSet = usages.some(usage =>
					usage.references.find(
						ref => isDisplayNameDefined(ref.identifier)
					)
				);

				if (!isDisplayNameSet) {
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
