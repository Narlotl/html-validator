// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('html-validator.validate', function () {
		// The code you place here will be executed every time your command is executed

		if (vscode.window.activeTextEditor) {
			if (vscode.workspace.getConfiguration('html-validator').get('file-types').includes(vscode.window.activeTextEditor.document.languageId)) {
				vscode.window.setStatusBarMessage('Checking HTML...');

				function onreadystatechange() {
					if (req.status == 200 && req.readyState == 4) {
						const panel = vscode.window.createWebviewPanel(
							'html-checker',
							'HTML Checker results',
							vscode.ViewColumn.Active,
							{}
						);
						let data = [req.responseText];
						data = data[0].substring(data[0].indexOf('<ol>') + 4, data[0].indexOf('</ol>')).split('</li>');
						if (data.length > 1) {
							data.forEach(error => {
								if (vscode.workspace.getConfiguration('html-validator').get('ignore').includes(error.split('').reduce((prevHash, currVal) =>
									(((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0)))
									data.splice(data.indexOf(error), 1);
							});
							panel.webview.html = `
							<style>
								.error strong {
									background-color:rgb(255,100,100);
								}
									
								.warning strong {
									background-color:rgb(250,151,58);
								}
							</style>
							<ul>
							<h1>HTML Checker results</h1>
							<h2>` + (data.length - 1) + ' issues found</h2>';
							data.pop();
							data.forEach(error => {
								panel.webview.html += error + '<small><i>ID: ' + error.split('').reduce((prevHash, currVal) =>
									(((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0) + '</i></small></li>'
							});
							panel.webview.html += '</ul>'
							this.resolve();
						}
						else
							panel.webview.html = '<h1>No errors found!</h1>';
					}
					else if (req.readyState == 4) {
						vscode.window.showErrorMessage(req.statusText);
						this.reject();
					}

					vscode.window.setStatusBarMessage('');
				}

				const req = new XMLHttpRequest();
				req.open('POST', 'https://validator.w3.org/nu/#textarea');
				req.onreadystatechange = onreadystatechange;
				req.setRequestHeader('Content-Type', 'text/html');
				let text = vscode.window.activeTextEditor.document.getText().replaceAll(/{%.*%}|{{.*}}/gm, '');
				if (text.indexOf('---') == 0)
					text = text.replace(/---(.|\n)*---/gm, '');
				req.send(text);
			}
			else
				vscode.window.showErrorMessage('Please open an HTML file');
		}
		else
			vscode.window.showErrorMessage('No active text editor');
	});

	context.subscriptions.push(disposable);
	const sb = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 1);
	context.subscriptions.push(sb);
	sb.text = '$(file-code) Check HTML';
	sb.tooltip = 'Check HTML';
	sb.command = 'html-validator.validate';
	sb.show();
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}