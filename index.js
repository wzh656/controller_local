const {
	app,
	BrowserWindow,
	Menu, //菜单
	ipcMain //交互通信
} = require("electron");
const {exec, execFile} = require("child_process"); //命令
const fs = require("fs"); //文件处理
const path = require("path"); //路径处理

let win, win2; // 保存窗口对象的全局引用, 如果不这样做, 当JavaScript对象被当做垃圾回收时，window窗口会自动关闭
let newWindows = []; //新建的窗口
let tray = null; //托盘

//fs新增函数 递归创建目录
fs.mkdirsSync = function(dirname){
	if (fs.existsSync(dirname)) return; //已存在
	fs.mkdirsSync(path.dirname(dirname)); //递归创建上层目录
	fs.mkdirSync(dirname); //创建本层目录
};

const CONFIG = JSON.parse(
	fs.readFileSync( path.join(__dirname, "config.json"), "utf-8" )
); //配置文件
const ID = Math.random().toString(36).substr(2); //随机ID
const INPUT = path.join(CONFIG.local_path, "input");
const OUTPUT = path.join(CONFIG.local_path, "output");



//运行Commands .cmd
function runCommands(code){
	return new Promise((resolve, reject)=>{
		if ( !fs.existsSync(INPUT) ) //不存在
			fs.mkdirsSync(INPUT);
		if ( !fs.existsSync(OUTPUT) ) //不存在
			fs.mkdirsSync(OUTPUT);

		const name = `${+new Date()}@${ID}.cmd`;
		const file = path.join(INPUT, name);
		const cbFile = path.join(OUTPUT, name+".cb");
		fs.writeFileSync(file, code);
		const id = setInterval(()=>{
			if ( !fs.existsSync(cbFile) ) return;
			const result = fs.readFileSync(cbFile).toString();
			fs.unlinkSync(cbFile);
			clearInterval(id);
			resolve(result);
		}, 0);
	});
}

//运行Javascript .js
function runJs(code){
	return new Promise((resolve, reject)=>{
		if ( !fs.existsSync(INPUT) ) //不存在
			fs.mkdirsSync(INPUT);
		if ( !fs.existsSync(OUTPUT) ) //不存在
			fs.mkdirsSync(OUTPUT);

		const name = `${+new Date()}@${ID}.js`;
		const file = path.join(INPUT, name);
		const cbFile = path.join(OUTPUT, name+".cb");
		fs.writeFileSync(file, code);
		const id = setInterval(()=>{
			if ( !fs.existsSync(cbFile) ) return;
			const result = fs.readFileSync(cbFile).toString();
			fs.unlinkSync(cbFile);
			clearInterval(id);
			resolve(result);
		}, 0);
	});
}

//运行Electron .elec
function runElectron(code){
	return new Promise((resolve, reject)=>{
		if ( !fs.existsSync(INPUT) ) //不存在
			fs.mkdirsSync(INPUT);
		if ( !fs.existsSync(OUTPUT) ) //不存在
			fs.mkdirsSync(OUTPUT);

		const name = `${+new Date()}@${ID}.elec`;
		const file = path.join(INPUT, name);
		const cbFile = path.join(OUTPUT, name+".cb");
		fs.writeFileSync(file, code);
		const id = setInterval(()=>{
			if ( !fs.existsSync(cbFile) ) return;
			const result = fs.readFileSync(cbFile).toString();
			clearInterval(id);
			resolve(result);
		}, 0);
	});
}




function createWindow(){
	// 创建浏览器窗口
	win = new BrowserWindow({
		width: 1200,
		height: 600,
		autoHideMenuBar: true, //隐藏菜单
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
			contextIsolation: false
		}
	});

	win2 = new BrowserWindow({
		width: 1200,
		height: 600,
		autoHideMenuBar: true, //隐藏菜单
		webPreferences: {
			nodeIntegration: true,
			nodeIntegrationInWorker: true,
			contextIsolation: false
		}
	});

	win.setMenu(null); //隐藏菜单
	win.loadURL(`file://${__dirname}/index.html`); //加载index.html文件
	win.webContents.openDevTools(); //打开开发工具

	win2.setMenu(null); //隐藏菜单
	win2.loadURL(`file://${__dirname}/bilibili.html`); //加载index.html文件
	win2.webContents.openDevTools(); //打开开发工具

	win2.webContents.send("local_path", CONFIG.local_path);

	
	//执行Commands .cmd
	ipcMain.on("commands", function(event, code){
		runCommands(code).then(data => {
			event.sender.send("commands_output", data);
		});
	});

	//执行Javascript .js
	ipcMain.on("javascript", function(event, code){
		runJs(code).then(data => {
			event.sender.send("javascript_output", data);
		});
	});

	//执行Electron .elec
	ipcMain.on("electron", function(event, code){
		runElectron(code).then(data => {
			event.sender.send("electron_output", data);
		});
	});
	

	//关闭窗口
	win.on("closed", () => {
		// 取消引用窗口对象, 如果你的应用程序支持多窗口，通常你会储存windows在数组中，这是删除相应元素的时候。
		console.log("closed");
		
		win = null;
		app.quit();
	});
	
}

app.on("activate", () => {
	console.log("activate")
	if (win === null){
		createWindow();
	}else{
		win.show();
	}
});

// 当Electron完成初始化并准备创建浏览器窗口时，将调用此方法
// 一些api只能在此事件发生后使用。
app.on("ready", createWindow);

// 当所有窗口关闭时退出。
app.on("window-all-closed", ()=>{
	// 在macOS上，用得多的是应用程序和它们的菜单栏，用Cmd + Q退出。
	if (process.platform !== "darwin"){
		console.log("window-all-closed");
		app.quit();
	}
});

app.on("activate", ()=>{
	console.log("activate");
	// 在macOS上，当点击dock图标并且没有其他窗口打开时，通常会在应用程序中重新创建一个窗口。
	if (win === null) {
		createWindow();
	}
});
