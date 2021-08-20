
let ctx, grid = 43, images = {}, manX, manY, curCar, touchable = false, grids=[], curMove, editMode = false, solving = false
let targets
let touchX, touchY, backupCars = []

window.addEventListener('keydown', function(event) {
	let nextX = manX, nextY = manY
	let nextX2 = manX, nextY2 = manY
	switch(event.key) {
		case 'ArrowUp': {
			nextY = manY - 1
			nextY2 = nextY - 1
			drawAll()
			break
		}

		case 'ArrowDown': {
			nextY = manY + 1
			nextY2 = nextY + 1
			drawAll()
			break
		}

		case 'ArrowLeft': {
			nextX = manX - 1
			nextX2 = nextX - 1
			drawAll()
			break
		}

		case 'ArrowRight': {
			nextX = manX + 1
			nextX2 = nextX + 1
			break
		}
	}
	if(nextX != manX || nextY != manY) {
		if(grids[nextY][nextX] == floor) {
			manX = nextX
			manY = nextY
			curMove++
		}
		if(grids[nextY][nextX] == box && grids[nextY2][nextX2] == floor ) {
			manX = nextX
			manY = nextY
			grids[manY][manX] = floor
			grids[nextY2][nextX2] = box
			curMove++
		}
		moveNumber.innerHTML = curMove
		drawAll()
	}
})

function loadinit() {

	ctx = canvas.getContext("2d")
	loadImages(['box', 'floor', 'target', 'wall', 'man', 'box2'], () => {
		restart()
	});
	
	

	canvas.addEventListener("mousedown", function (event) {
		if(!touchable) {
			touchstart(event.offsetX, event.offsetY)
		}
	}, false);
	canvas.addEventListener("mousemove", function (event) {
		if(!touchable && event.buttons != 0) {
			touchmove(event.offsetX, event.offsetY)
		}
	}, false);

}

function init(c, boardW, boardH, exitX, exitY) {
	targets = []
	grids=[]
	for(let i = 0;i < c.length;i++) {
		grids[i] = []
		for(let j = 0;j < c[i].length;j++) {
			grids[i][j] = c[i][j]
			if(grids[i][j] == man) {
				grids[i][j] = floor
				manX = j
				manY = i
			} else if(grids[i][j] == target) {
				grids[i][j] = floor
				targets.push([j, i])
			} else if(grids[i][j] == box2) {
				grids[i][j] = box
				targets.push([j, i])
			}
		}
	}
	curMove = 0
	moveNumber.innerHTML = curMove
	// updateBoard()
	drawAll()
}

function restart() {
	init(levels[curLevel], 6, 6, 7, 3)
}

// toggle edit mode
function edit() {
	editMode = !editMode;
	if(editMode) {
		drawBackup()
	} else {
		ctx.clearRect(630,0,150,650); 
	}
}
// remove all cars
function empty() {
	grids = []
	targets = []
	drawAll()
	if(editMode) {
		drawBackup()
	}
}

function drawAll() {
	ctx.clearRect(0,0,650,650); 
	for(let i = 0;i < grids.length;i++) {
		if(grids[i]) {
			for(let j = 0;j < grids[i].length;j++) {
				draw(grids[i][j], grid * j, grid * i, grid, grid)
			}
		}
	}
	if(!editMode) {
		for(let t of targets) {
			if(grids[t[1]][t[0]] == floor) {
				draw(target, grid * t[0], grid * t[1], grid, grid)
			} else if(grids[t[1]][t[0]] == box) {
				draw(box2, grid * t[0], grid * t[1], grid, grid)
			}
		}
		draw(man, grid * manX, grid * manY, grid, grid)
	}
}

function drawBackup() {
	let startY = 0.5;
	for(let i = 0;i < 7;i++) {
		draw(i, grid * 16.0, grid * startY, grid, grid)
		backupCars.push([16.0, startY, grid, grid, i])
		startY += 1
	}
}


function draw(type, x, y, w, h) {
	if(type > 0) {
		ctx.drawImage(images[names[type]], x, y, w, h)
	}
}


function touchstart(ex, ey) {
	if(editMode) {
		let x = ex / grid
		let y = ey / grid
		for(let [index, car] of backupCars.entries()) {
			if(x >= car[0] && x < car[2] + car[0] &&
				y >= car[1] && y < car[3] + car[1]) {
				curCar = car[4]
			}
		}
		addGrid(ex, ey, curCar)
	}
}

function touchmove(ex, ey) {
	if(editMode) {
		addGrid(ex, ey, curCar)
	}
}

function addGrid(ex, ey, curCar) {
	let x = Math.floor(ex / grid)
	let y = Math.floor(ey / grid)
	if(x >= 0 && y >= 0 && x < 16 & y < 16) {
		if(!grids[y]) {
			grids[y] = []
		}
		if(grids[y][x] != curCar) {
			grids[y][x] = curCar
			drawAll()
		}
	}
}

// update board occupied
function updateBoard() {
	board = updateBoardBase(cars)
}

let historyMoves, win, winMoves
async function solve() {
	if(solving) {
		solving = false;
		return;
	}
	historyMoves = {}
	win = false
	winMoves = []
	let pc = tryAllMoves(cars, 0)
	if(!pc) {
		return;
	}
	while(pc[0] != -1) {
		winMoves.unshift(pc[2])
		pc = pc[3]
	}
	solving = true
	for(let [index, cars2] of winMoves.entries()) {
		if(!solving) {
			return;
		}
		cars = cars2
		drawAll()
		moveNumber.innerHTML = index + 1
		await sleep(500)
	}
	solving = false
}

function tryAllMoves(carsInit, level) {
	let possibleMoves = [[-1, 0, carsInit, null, 1]]
	let cnt = 0;
	while(possibleMoves.length > 0) {
		if(++cnt > 50000) {
			alert('too many tries')
			return;
		}
		let pc = possibleMoves.shift()
		let cars = pc[2]

		let board = updateBoardBase(cars)
		if(board[7][3] == 1) {
			win = true
			return pc;
		}

		for(let i = 0;i < cars.length;i++) {
			let car = cars[i]
	
			if(car[2][0] == 1) {	// vertical
				if(board[car[0]][car[1] + car[2][1]] == 0) {
					car[1]++
					if(isNewMove(cars)) {
						possibleMoves.push([i, 1, copyCars(cars), pc, pc[4] + 1]);
					}
					car[1]--
				}
				if(board[car[0]][car[1] - 1] == 0) {
					car[1]--
					if(isNewMove(cars)) {
						possibleMoves.push([i, 2, copyCars(cars), pc, pc[4] + 1]);
					}
					car[1]++
				}
			} else {
				if(board[car[0] + car[2][0]][car[1]] == 0) {
					car[0]++
					if(isNewMove(cars)) {
						possibleMoves.push([i, 3, copyCars(cars), pc, pc[4] + 1]);
					}
					car[0]--
				}
				if(board[car[0] - 1][car[1]] == 0) {
					car[0]--
					if(isNewMove(cars)) {
						possibleMoves.push([i, 4, copyCars(cars), pc, pc[4] + 1]);
					}
					car[0]++
				}
			}
		}
	}
	
}

function isNewMove(cars) {
	let hash = genHash(cars);
	if(historyMoves[hash]) {
		return false
	}
	historyMoves[hash] = 1;
	return true;
}

function updateBoardBase(cars, excludeCar) {
	let board = [
		[1,1,1,1,1,1,1,1,1],
		[1,0,0,0,0,0,0,1,1],
		[1,0,0,0,0,0,0,1,1],
		[1,0,0,0,0,0,0,1,1],
		[1,0,0,0,0,0,0,1,1],
		[1,0,0,0,0,0,0,1,1],
		[1,0,0,0,0,0,0,1,1],
		[1,1,1,0,1,1,1,1,1],
		[1,1,1,1,1,1,1,1,1],
	]
	for(let car of cars) {
		if(car == excludeCar) {
			continue;
		}
		if(car[2][0] == 1) {	// vertical
			for(let y = 0;y < car[2][1];y++) {
				board[car[0]][car[1] + y] = 1
			}
		} else {
			for(let x = 0;x < car[2][0];x++) {
				board[car[0] + x][car[1]] = 1
			}
		}
	}
	return board;
}

function genHash(cars) {
	let ret = new Array();
	for(let car of cars) {
		ret.push(car[0])
		ret.push(car[1])
	}
	return ret.join('')
}

function copyCars(cars) {
	let cars2 = []
	for(let car of cars) {
		cars2.push([car[0], car[1], car[2]])
	}
	return cars2
}


function loadImages(sources, callback){
	var count = 0,
			imgNum = 0
	for(let src of sources){
			imgNum++
	}
	for(let src of sources){
			images[src] = new Image(src);
			images[src].onload = images[src].onerror = function(){
					if(++count >= imgNum){
							callback(images)
					}
			};

			images[src].src = 'res/' + src + '.png'
	}
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}