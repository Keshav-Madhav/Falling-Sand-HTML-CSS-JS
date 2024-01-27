var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');

var isMouseDown = false;
var lastEvent;
var radius = 2;
var hue = 0;
var hueIncrement = 0.1;
var platformStart, platformEnd;


function spawnSand(event) {
  var cellSize = 5;
  var x, y;

  // Check if the event is a touch event
  if (event.touches) {
    x = Math.floor(event.touches[0].clientX / cellSize);
    y = Math.floor(event.touches[0].clientY / cellSize);
  } else {  // The event is a mouse event
    x = Math.floor(event.clientX / cellSize);
    y = Math.floor(event.clientY / cellSize);
  }

  // Spawn sand in a radius around the click or touch point
  for (var i = -Math.abs(radius); i <= Math.abs(radius); i++) {
    for (var j = -Math.abs(radius); j <= Math.abs(radius); j++) {
      if (i*i + j*j <= radius*radius) {  // Check if the cell is within the radius
        var newX = x + j;
        var newY = y + i;
        // Check if the new coordinates are within the grid
        if (newX >= 0 && newX < grid[0].length && newY >= 0 && newY < grid.length) {
          if (radius > -1) {
            hue = (hue + hueIncrement) % 360;  // Increment and wrap the hue
            grid[newY][newX] = hue;  // Spawn sand with the current hue
          } else {
            grid[newY][newX] = 0;  // Remove sand
          }
        }
      }
    }
  }
}

// Add an event listener for the wheel event on the canvas
canvas.addEventListener('wheel', function(event) {
  
  if (event.deltaY < 0) {
    // Scroll up, increase the radius
    radius = Math.min(radius + 1, 4);
  } else {
    // Scroll down, decrease the radius
    radius = Math.max(radius - 1, -3);
  }

  event.preventDefault();
}, { passive: false });  // Add the passive option and set it to false to make preventDefault work


canvas.addEventListener('mousedown', function(event) {
  if(event.button === 0) {
    isMouseDown = true;
    lastEvent = event;
  }
  if (event.button === 2) {  // Right mouse button
    platformStart = { x: event.clientX, y: event.clientY };
  }
});
canvas.addEventListener('mouseup', function(event) {
  if(event.button === 0) {
    isMouseDown = false;
  }
  if (event.button === 2) {  // Right mouse button
    platformEnd = { x: event.clientX, y: event.clientY };
    createPlatform(platformStart, platformEnd);
  }
});
canvas.addEventListener('mousemove', function(event) {
  if(isMouseDown) {
    spawnSand(event);
  }
});
canvas.addEventListener('touchstart', function(event) {
  event.preventDefault();
  isMouseDown = true;
  lastEvent = event;
});
canvas.addEventListener('touchend', function() {
  isMouseDown = false;
});
canvas.addEventListener('touchmove', function(event) {
  if (isMouseDown) {
    lastEvent = event;
  }
});

// Continuously spawn sand at the last known mouse or touch position
setInterval(function() {
  if (isMouseDown) {
    spawnSand(lastEvent);
  }
}, 30);

canvas.addEventListener('contextmenu', function(event) {
  event.preventDefault();  // Prevent the context menu from showing
});

window.addEventListener('keydown', function(event) {
  if (event.key === 'r') {
    for (var i = 0; i < grid.length; i++) {
      grid[i].fill(0);
    }
  }
});

function createPlatform(start, end) {
  var cellSize = 5;
  var startX = Math.floor(start.x / cellSize);
  var startY = Math.floor(start.y / cellSize);
  var endX = Math.floor(end.x / cellSize);
  var endY = Math.floor(end.y / cellSize);

  var dx = Math.abs(endX - startX);
  var dy = Math.abs(endY - startY);
  var sx = (startX < endX) ? 1 : -1;
  var sy = (startY < endY) ? 1 : -1;
  var err = dx - dy;

  while(true){
    grid[startY][startX] = -1;  // Set the grid cell to -1 to create the platform

    if ((startX === endX) && (startY === endY)) break;
    var e2 = 2*err;
    if (e2 > -dy){ err -= dy; startX += sx; }
    if (e2 < dx){ err += dx; startY += sy; }
  }
}


// Function to create a grid
function createGrid() {
  var width = window.innerWidth - 8;
  var height = window.innerHeight - 2;
  var cellSize = 5;
  var cellsX = Math.ceil(width / cellSize);
  var cellsY = Math.ceil(height / cellSize);
  var grid = new Array(cellsY);
  for (var i = 0; i < cellsY; i++) {
      grid[i] = new Array(cellsX).fill(0);
  }
  return grid;
}

// Function to draw a grid on a canvas
function drawGrid(ctx, grid, cellSize) {
  for (var i = 0; i < grid.length; i++) {
    for (var j = 0; j < grid[i].length; j++) {
      if (grid[i][j] > 0) {
        ctx.fillStyle = 'hsl(' + grid[i][j] + ', 100%, 50%)';
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
      else if (grid[i][j] === -1) {
        ctx.fillStyle = 'white';
        ctx.fillRect(j * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Function to handle sand falling logic
function handleSandFalling(oldGrid, i, j) {
  var below = oldGrid[i + 1][j];
  var belowLeft = j > 0 ? oldGrid[i + 1][j - 1] : 1;
  var belowRight = j < oldGrid[i].length - 1 ? oldGrid[i + 1][j + 1] : 1;

  if (below === 0) {
    oldGrid[i + 1][j] = oldGrid[i][j];
    oldGrid[i][j] = 0;
  } else if (belowLeft === 0 && belowRight === 0) {
    if (Math.random() < 0.5) {
      oldGrid[i + 1][j - 1] = oldGrid[i][j];
    } else {
      oldGrid[i + 1][j + 1] = oldGrid[i][j];
    }
    oldGrid[i][j] = 0;
  } else if (belowLeft === 0) {
    oldGrid[i + 1][j - 1] = oldGrid[i][j];
    oldGrid[i][j] = 0;
  } else if (belowRight === 0) {
    oldGrid[i + 1][j + 1] = oldGrid[i][j];
    oldGrid[i][j] = 0;
  }
}

function fallingSand(oldGrid) {
  for (var i = oldGrid.length - 2; i >= 0; i--) {
    // Alternate the direction for each row
    if (i % 2 === 0) {
      // Process the cells from left to right
      for (var j = 0; j < oldGrid[i].length; j++) {
        if (oldGrid[i][j] > 0) {
          handleSandFalling(oldGrid, i, j);
        }
        else if (oldGrid[i][j] === -1) {
          oldGrid[i][j] = -1;
        }
      }
    } else {
      // Process the cells from right to left
      for (var j = oldGrid[i].length - 1; j >= 0; j--) {
        if (oldGrid[i][j] > 0) {
          handleSandFalling(oldGrid, i, j);
        }
        else if (oldGrid[i][j] === -1) {
          oldGrid[i][j] = -1;
        }
      }
    }
  }
}

function animate(grid) {
  // Set the canvas size to match the window
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Clear the canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  var cellSize = 5;

  fallingSand(grid);  // Update the grid

  drawGrid(ctx, grid, cellSize);

  requestAnimationFrame(function() {
      animate(grid);
  });
}

// Create the grid and start the animation
var grid = createGrid();
animate(grid);
