const { exec } = require('child_process');

exec('npm audit --json', (err, stdout, stderr) => {
	let exitCode = 0;

	if (err) {
		console.log(stderr);
    }

	const data = JSON.parse(stdout);
	const {
		info,
		low,
		moderate,
		high,
		critical
	} = data.metadata.vulnerabilities;
	console.log('NPM Audit Report');
	console.log(`Info: ${info}`);
	console.log(`Low: ${low}`);
	console.log(`Modarate: ${moderate}`);
	console.log(`High: ${high}`);
	console.log(`Critical: ${critical}`);
	if (high > 0 || critical > 0) {
		exitCode = 1;
	}
	process.exit(exitCode);
});
