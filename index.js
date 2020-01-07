const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

// Configuration variables______

// The view
const width = window.innerWidth
const height = window.innerHeight

//Maze dimensions
const mazeWidth = prompt("Please enter your maze width:", "12");
const mazeHeight = prompt("Please enter your maze height:", "10");

const cellsHorizontal = parseInt(mazeWidth)
const cellsVertical = parseInt(mazeHeight)

const unitLengthX = width / cellsHorizontal
const unitLengthY = height / cellsVertical

const engine = Engine.create()
engine.world.gravity.y = 0
const { world } = engine
const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        wireframes: false,
        width,
        height
    }
})

Render.run(render)
Runner.run(Runner.create(), engine)


//Border
const walls = [
    Bodies.rectangle(width / 2, 0, width, 1, {
        isStatic: true
    }),

    Bodies.rectangle(width / 2, height, width, 1, {
        isStatic: true
    }),

    Bodies.rectangle(0, height / 2, 1, height, {
        isStatic: true
    }),

    Bodies.rectangle(width, height / 2, 1, height, {
        isStatic: true
    })
];

World.add(world, walls)

// Maze generation (verticals & horizontals = walls)

const shuffle = (arr) => {
    let counter = arr.length

    while (counter > 0) {
        const index = Math.floor(Math.random() * counter)
        counter--

        const temp = arr[counter]
        arr[counter] = arr[index]
        arr[index] = temp
    }
    return arr
}

const grid = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal).fill(false))

const verticals = Array(cellsVertical).fill(null).map(() => Array(cellsHorizontal - 1).fill(false))

const horizontals = Array(cellsVertical - 1).fill(null).map(() => Array(cellsHorizontal).fill(false))

//Starting point/cell
const startRow = Math.floor(Math.random() * cellsVertical)
const startColumn = Math.floor(Math.random() * cellsHorizontal)

//Maze movement algorithm
const cellMovement = (row, column) => {
    //If cell has been visited, return
    if (grid[row][column]) {
        return
    }
    //Mark cell as visited
    grid[row][column] = true
    //Assemble list of neighbouring cells (up, right, down left)
    const neighbours = shuffle([
        [row - 1, column, 'up'],
        [row, column + 1, 'right'],
        [row + 1, column, 'down'],
        [row, column - 1, 'left']
    ])

    //Loop neighbours
    for (let neighbour of neighbours) {
        const [nextRow, nextColumn, direction] = neighbour

        //Check if cell is out of bounds
        if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
            continue
        }
        //Check if we have visited cell
        if (grid[nextRow][nextColumn]) {
            continue
        }
        //Remove wall from row or column (left/right=verticals; up/down=horizontals)
        if (direction === 'left') {
            verticals[row][column - 1] = true
        } else if (direction === 'right') {
            verticals[row][column] = true
        } else if (direction === 'up') {
            horizontals[row - 1][column] = true
        } else if (direction === 'down') {
            horizontals[row][column] = true
        }

        cellMovement(nextRow, nextColumn)
    }
    //Visit next cell

}

cellMovement(startRow, startColumn)

//Drawing walls, false = walls
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX / 2, // center X
            rowIndex * unitLengthY + unitLengthY, // center Y
            unitLengthX, // rect length
            4, // rect width
            {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'red'
                }
            }
        )
        World.add(world, wall)
    })
})

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return
        }
        const wall = Bodies.rectangle(
            columnIndex * unitLengthX + unitLengthX, // center X
            rowIndex * unitLengthY + unitLengthY / 2, // center Y
            4,
            unitLengthY,
            {
                isStatic: true,
                label: 'wall',
                render: {
                    fillStyle: 'red'
                }
            }
        )
        World.add(world, wall)
    })
})

// Goal
const goal = Bodies.rectangle(
    width - unitLengthX / 2, // X coord
    height - unitLengthY / 2, // Y coord
    unitLengthX * .7, // Rect length
    unitLengthY * .7, // Rect width
    {
        isStatic: true,
        label: 'goal',
        render: {
            fillStyle: 'orange'
        }
    },
)
World.add(world, goal)

// Ball
const ballRadius = Math.min(unitLengthX, unitLengthY) / 3
const ball = Bodies.circle(
    unitLengthX / 2, // ball X
    unitLengthY / 2, //ball Y
    ballRadius, // ball size
    {
        label: 'ball'
    }
)

World.add(world, ball)

// Move the ball

document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity
    if (event.keyCode === 38) {
        Body.setVelocity(ball, { x, y: y - 3 }) //Up
    }
    if (event.keyCode === 39) {
        Body.setVelocity(ball, { x: x + 3, y }) //Right
    }
    if (event.keyCode === 40) {
        Body.setVelocity(ball, { x, y: y + 3 }) //Down
    }
    if (event.keyCode === 37) {
        Body.setVelocity(ball, { x: x - 3, y }) //Left
    }
})

//Detect win
Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach((collision) => {
        const labels = ['ball', 'goal']
        if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
            document.querySelector('.winner').classList.remove('hidden')
            world.gravity.y = 1
            world.bodies.forEach(body => {
                if (body.label === 'wall') {
                    Body.setStatic(body, false)
                }
            })
        }
    })
})

// Further thoughts, let user select size of maze