const vscode = require('vscode');
const vnu = require('vnu-jar');
const { execFile } = require('child_process');

const workspaceConfig = vscode.workspace.getConfiguration('html-validator');
const diagnosticCollection = vscode.languages.createDiagnosticCollection('html-validator');
const validate = /** @param {vscode.TextDocument} document @param {boolean} fromSave */ (document, fromSave) => {
	if (!workspaceConfig.get('validate-on-save') && fromSave)
		return;
	if (workspaceConfig.get('file-types').includes(document.languageId)) {
		vscode.window.setStatusBarMessage('Checking HTML...');

		const process = execFile('java', ['-jar', '"' + vnu + '"', '--html', '--format json', '-'], { shell: true }, (error, stdout, stderr) => {
			const data = JSON.parse(stderr).messages;

			diagnosticCollection.clear();
			const diagnostics = [];
			let errorLevel = false;
			for (const err of data) {
				if (err.type === 'error')
					errorLevel = true;
				diagnostics.push(new vscode.Diagnostic(new vscode.Range((err.firstLine || err.lastLine) - 1, err.firstColumn, err.lastLine - 1, err.lastColumn), err.message, err.type === 'error' ? vscode.DiagnosticSeverity.Error : vscode.DiagnosticSeverity.Warning));
			}
			diagnosticCollection.set(document.uri, diagnostics);

			if (!fromSave) {
				const message = 'HTML Validator: ' + data.length + ' error' + (data.length == 1 ? '' : 's') + ' found';
				if (data.length == 0)
					vscode.window.showInformationMessage(message);
				else if (errorLevel)
					vscode.window.showErrorMessage(message);
				else
					vscode.window.showWarningMessage(message);
			}

			vscode.window.setStatusBarMessage('');
		});

		let text = document.getText().replaceAll(/{%.*%}|{{.*}}/gm, '');
		if (text.indexOf('---') == 0)
			text = text.replace(/---(.|\n)*---/gm, '');
		process.stdin.write(text);
		process.stdin.end();
	}
	else if (!fromSave)
		vscode.window.showErrorMessage('Please open an HTML file');
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	let disposable = vscode.commands.registerCommand('html-validator.validate', function () {
		if (vscode.window.activeTextEditor)
			validate(vscode.window.activeTextEditor.document, false);
		else
			vscode.window.showErrorMessage('No active text editor');
	});

	vscode.workspace.onDidSaveTextDocument(document => validate(document, true));

	context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}