import { spawn } from 'child_process'

async function go() {
	console.log('Starting app...')
	await exec('npm start')
}
go()

async function exec(command) {
	const child = spawn(command, { shell: true, stdio: 'inherit' })
	await new Promise((res, rej) => {
		child.on('exit', code => {
			if (code === 0) {
				res()
			} else {
				rej()
			}
		})
	})
}
