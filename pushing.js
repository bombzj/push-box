
let ctx, grid = 60, images = {}, manX, manY, curCar, touchable = false, grids=[], curMove, editMode = false, solving = false
let targets
let touchX, touchY, tiles = []

window.addEventListener('keydown', function(event) {
	if(solving) return
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

	drawAll()
}

function restart() {
	solving = false
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
}

function drawAll() {
	ctx.clearRect(0,0,750,750); 
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
	
	if(editMode) {
		drawBackup()
	}
}

function drawBackup() {
	let startY = 0.5;
	for(let i = 0;i < 7;i++) {
		draw(i, grid * 12.0, grid * startY, grid, grid)
		tiles.push([12.0, startY, grid, grid, i])
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
		for(let [index, car] of tiles.entries()) {
			if(x >= car[0] && x < car[2] + car[0] &&
				y >= car[1] && y < car[3] + car[1]) {
				curCar = car[4]
			}
		}
		addTile(ex, ey, curCar)
	}
}

function touchmove(ex, ey) {
	if(editMode) {
		addTile(ex, ey, curCar)
	}
}

function addTile(ex, ey, curCar) {
	let x = Math.floor(ex / grid)
	let y = Math.floor(ey / grid)
	if(x >= 0 && y >= 0 && x < 12 & y < 12) {
		if(!grids[y]) {
			grids[y] = []
		}
		if(grids[y][x] != curCar) {
			grids[y][x] = curCar
			drawAll()
		}
	}
}

let historyMoves, win, winMoves
async function solve() {
	if(solving) {
		solving = false;
		return;
	}
	historyMoves = new Set()
	win = false
	solving = true
	winMoves = []
	let beginTime = Date.now()
	let pc = await tryAllMoves()
	console.log('solving cost ' + (Date.now() - beginTime) + ' ms')
	if(!pc) {
		return;
	}
	while(pc.last) {
		winMoves.unshift(pc)
		pc = pc.last
	}
	for(let move of winMoves) {
		if(move.direction) {
			let dy = move.direction > 0 ? (move.direction >> 4) : -(-move.direction >> 4)
			let path = getPath(grids, (move.man % 16) - (move.direction % 16), (move.man >> 4) - dy)
			for(let step of path) {
				if(!solving) return;
				manX = step[1]
				manY = step[0]
				drawAll()
				moveNumber.innerHTML = Math.floor(moveNumber.innerHTML) + 1
				await sleep(300)
			}
			if(!solving) return;
		}

		// grids = []
		// for(let [index, i] of move.grid.entries()) {
		// 	let x = index % 16
		// 	let y = index >> 4
		// 	if(!grids[x]) grids[x] = []
		// 	grids[y][x] = i
		// }
		for(let i = 0;i < grids.length;i++) {
			for(let j = 0;j < grids[i].length;j++) {
				if(grids[i][j] == box) {
					grids[i][j] = floor
				}
			}
		}
		for(let i of move.boxes) {
			grids[i >> 4][i % 16] = box
		}
		manX = move.man % 16
		manY = move.man >> 4
		drawAll()
		moveNumber.innerHTML = Math.floor(moveNumber.innerHTML) + 1
		await sleep(400)
	}
	solving = false
}

allDeadEnds = []
var addedMove
async function tryAllMoves() {
	for(let i = 0;i < grids.length;i++) {
		for(let j = 0;j < grids[i].length;j++) {
			let g = grids[i][j]
			if(g == box) g = floor
			gridData[(i << 4) + j + gridDataLength] = g
		}
	}
	let move = new Move((manY << 4) + manX)
	move.initBox()
	allDeadEnds = move.deadend()

	let possibleMoves = new LinkedList([move])
	let cnt = 0;
	// prepare some data to reuse
	calcGridData.fill()
	let dup = 0
	addedMove = 0
	let umove = 0	// unique possibilities
	while(possibleMoves.length > 0 && solving) {
		if(++cnt > 30000000) {
			console.log('too many tries ' + cnt)
			return;
		}
		let pc = possibleMoves.shift()

		gridData.copyWithin(0, gridDataLength, gridDataLength * 2)
		for(let b of pc.boxes) {
			gridData[b] = box
		}
		
		if(pc.isWin()) {
			win = true
			console.log('solving count ' + cnt + ' uniq ' + umove)
			return pc;
		}
		if(cnt % 10000 == 0) {
			console.log('solving count ' + cnt + ' dup ' + dup + ' added ' + addedMove + ' uniq ' + umove + ' left ' + possibleMoves.length)
			dup = 0
			addedMove = 0
			await sleep(1)
		}

		let grid = pc.calcGrid()
		if(!isNewMove(pc)) {
			dup++
			continue
		}
		umove++
		
		for(let i = 0;i < pc.boxes.length;i++) {
			tryBox(pc, grid, i, 1, 0, possibleMoves)
			tryBox(pc, grid, i, -1, 0, possibleMoves)
			tryBox(pc, grid, i, 0, 1, possibleMoves)
			tryBox(pc, grid, i, 0, -1, possibleMoves)
		}
		delete pc.grid
	}
	
}

function tryBox(move, grid, boxIndex, dx, dy, possibleMoves) {
	let curBox = move.boxes[boxIndex]
	let x = curBox >> 4, y = curBox % 16
	let pos = (x << 4) + y
	let dpos = (dx << 4) + dy
	let x2 = x + dx, y2 = y + dy
	let pos2 = pos + dpos
	let pos3 = pos - dpos
	if((grid[pos2] == floor || grid[pos2] == passed) && grid[pos3] == passed && allDeadEnds[x2][y2] != -1) {
		let next = move.clone()
		addedMove++
		next.last = move	// link them together
		next.man = pos
		next.boxes[boxIndex] = pos2
		next.direction = dpos
		possibleMoves.push(next)
	}
}

function isNewMove(move) {
	let hash = move.hash();
	if(historyMoves.has(hash)) {
		return false
	}
	historyMoves.add(hash)
	return true;
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

const gridDataLength = 176
const calcGridData = new Uint8ClampedArray(gridDataLength)
const gridData = new Uint8ClampedArray(gridDataLength * 2)	// first half to use and second half to copy from
// data for each move while solving
class Move {
	constructor(man, boxes) {
		this.man = man
		this.boxes = boxes
	}

	initBox() {
		let boxes = []
		for(let i = 0;i < grids.length;i++) {
			for(let j = 0;j < grids[i].length;j++) {
				if(grids[i][j] == box) {
					boxes.push([i, j])
				}
			}
		}
		this.boxes = new Array(boxes.length)
		for(let [index, i] of boxes.entries()) {
			this.boxes[index] = (i[0] << 4) + i[1]
		}
	}

	isWin() {
		for(let i of targets) {
			if(gridData[(i[1] << 4) + i[0]] != box) {
				return false
			}
		}
		return true
	}
	hash() {
		this.boxes.sort()
		let ret = [...this.boxes, this.topleft]	// put boxes in order by position
		return ret.join('')
	}
	clone() {
		let boxes = [...this.boxes]
		return new Move(undefined, boxes)
	}
	// get all places can go
	calcGrid() {
		this.topleft = this.man
		for(let [index,i] of gridData.entries()) {
			calcGridData[index] = i
		}

		const manPos = this.man
		calcGridData[manPos] = passed
		let possibles = [manPos]
		for(let i = 0;i < 1000 && possibles.length > 0;i++) {
			let cur = possibles.shift()
			this.tryPos(possibles, calcGridData, cur - 16)
			this.tryPos(possibles, calcGridData, cur - 1)
			this.tryPos(possibles, calcGridData, cur + 1)
			this.tryPos(possibles, calcGridData, cur + 16)
		}

		return calcGridData
	}

	tryPos(possibles, grid, pos) {
		if(grid[pos] == floor) {
			grid[pos] = passed
			possibles.push(pos)
			if(pos < this.topleft) {
				this.topleft = pos
			}
		}
	}

	// get all deadends
	deadend() {
		const grid = cloneArray(grids)

		for(let i of targets) {
			grid[i[1]][i[0]] = target
		}
		let d = cloneArray(grid)
		// corders are deadends
		for(let i = 0;i < grid.length;i++) {
			for(let j = 0;j < grid[i].length;j++) {
				if(grid[i][j] == floor) {
					let f1 = grid[i + 1][j] == wall
					let f2 = grid[i][j + 1] == wall
					let f3 = grid[i - 1][j] == wall
					let f4 = grid[i][j - 1] == wall
					if(f1 && f2 || f2 && f3 || f3 && f4 || f4 && f1) {
						d[i][j] = -1
					}
				}
			}
		}
		// bottom lines are deadends
		for(let i = 0;i < grid.length;i++) {
			for(let j = 0;j < grid[i].length;j++) {
				if(grid[i][j] == box) {
					grid[i][j] = floor
				}
			}
		}
		const possibles = []
		for(let t of targets) {
			possibles.push([t[1], t[0]])
		}
		for(let i = 0;i < 1000 && possibles.length > 0;i++) {
			let cur = possibles.shift()
			this.tryTarget(possibles, grid, cur, 1, 0)
			this.tryTarget(possibles, grid, cur, -1, 0)
			this.tryTarget(possibles, grid, cur, 0, 1)
			this.tryTarget(possibles, grid, cur, 0, -1)
		}

		for(let i = 0;i < grid.length;i++) {
			for(let j = 0;j < grid[i].length;j++) {
				if(grid[i][j] == floor) {
					d[i][j] = -1
				}
			}
		}

		return d
	}

	tryTarget(possibles, grid, cur, dx, dy) {
		let x = cur[0] + dx
		let y = cur[1] + dy
		if(grid[x][y] == floor && grid[x + dx][y + dy] != wall) {
			grid[x][y] = target
			possibles.push([x, y])
		}
	}
}

function getPath(grid, destX, destY) {
	let path = []
	grid = cloneArray(grid)

	grid[manY][manX] = passed
	let possibles = [[manY, manX]]
	for(let i = 0;i < 1000 && possibles.length > 0;i++) {
		let cur = possibles.shift()
		if(cur[0] == destY && cur[1] == destX) {
			while(cur[2]) {
				path.unshift(cur)
				cur = cur[2]
			}
			return path
		}
		tryPath(possibles, grid, cur[0] + 1, cur[1], cur)
		tryPath(possibles, grid, cur[0] - 1, cur[1], cur)
		tryPath(possibles, grid, cur[0], cur[1] + 1, cur)
		tryPath(possibles, grid, cur[0], cur[1] - 1, cur)
	}
	return path
}

function tryPath(possibles, grid, x, y, cur) {
	if(grid[x][y] == floor) {
		grid[x][y] = passed
		possibles.push([x, y, cur])
	}
}

function cloneArray(arr) {
	let arr2 = []
	for(let [index,i] of arr.entries()) {
		arr2[index] = [...i]
	}
	return arr2
}