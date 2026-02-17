const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const progressBar = document.getElementById("progressBar");
const resetBtn = document.getElementById("resetBtn");

const pauseBtn = document.getElementById("pauseBtn");
let isPaused = false;

canvas.height = window.innerHeight / 2;
canvas.width = window.innerWidth / 2;

let circles = [];
let totalCircles = 60;
let circlesPerLevel = 10;
let currentLevel = 1;
let score = 0;
let baseSpeed = 0.8;
let animationId;

const scoreText = document.getElementById("score");
const levelText = document.getElementById("level");
const progressText = document.getElementById("progress");
const startBtn = document.getElementById("startBtn");


// ======================= CLASE CIRCLE =======================

class Circle {
    constructor(x, y, radius, speed) {
        this.radius = radius;
        this.baseSpeed = speed;

        this.baseColor = "rgb(190, 18, 18)";
        this.color = "rgb(190, 18, 18)";

        this.opacity = 1;
        this.removing = false;
        this.clicked = false;
        this.escape = false; // NUEVO

        this.resetPosition();
    }

    resetPosition() {
        this.posX = Math.random() * (canvas.width - this.radius * 2) + this.radius;
        this.posY = canvas.height + Math.random() * 200;

        this.dx = (Math.random() - 0.5) * this.baseSpeed;
        this.dy = -this.baseSpeed;

        this.opacity = 1;
        this.removing = false;
        this.escape = false;
    }

    draw() {
        ctx.beginPath();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.closePath();
        ctx.globalAlpha = 1;
    }

    update() {

        if (!this.removing) {

            this.posX += this.dx;
            this.posY += this.dy;

            // Rebote lateral
            if ((this.posX + this.radius) > canvas.width || (this.posX - this.radius) < 0) {
                this.dx *= -1;
            }

            // 🔴 Si llega arriba → iniciar desaparición lenta
            if ((this.posY - this.radius) <= 0) {
                this.removing = true;
                this.escape = true; // importante
            }
        }

        // Animación de desvanecimiento
        if (this.removing) {
            this.opacity -= 0.03;

            if (this.opacity <= 0) {

                if (this.escape) {
                    // Si escapó → reaparece abajo
                    this.resetPosition();
                }
                // Si fue clickeado → NO hacemos reset aquí
                // Se eliminará en el game loop
            }
        }

        this.draw();
    }
}


// ======================= COLISIONES =======================

function areColliding(c1, c2) {
    const dx = c2.posX - c1.posX;
    const dy = c2.posY - c1.posY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= (c1.radius + c2.radius);
}

function resolveCollision(c1, c2) {

    const dx = c2.posX - c1.posX;
    const dy = c2.posY - c1.posY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const nx = dx / distance;
    const ny = dy / distance;

    const p =
        2 *
        (c1.dx * nx + c1.dy * ny - c2.dx * nx - c2.dy * ny) /
        2;

    c1.dx = c1.dx - p * nx;
    c1.dy = c1.dy - p * ny;
    c2.dx = c2.dx + p * nx;
    c2.dy = c2.dy + p * ny;

    const overlap = (c1.radius + c2.radius) - distance;

    c1.posX -= overlap * nx / 2;
    c1.posY -= overlap * ny / 2;
    c2.posX += overlap * nx / 2;
    c2.posY += overlap * ny / 2;
}


// ======================= CREAR NIVEL =======================

function createLevel() {

    circles = [];

    let speed = baseSpeed + (currentLevel - 1) * 0.6;

    for (let i = 0; i < circlesPerLevel; i++) {

        let radius = 20 + Math.random() * 15;
        let x = Math.random() * (canvas.width - radius * 2) + radius;
        let y = canvas.height + Math.random() * 200;

        circles.push(new Circle(x, y, radius, speed));
    }

    levelText.textContent = currentLevel;
}


// ======================= GAME LOOP =======================

function updateGame() {

    animationId = requestAnimationFrame(updateGame);
    if (isPaused) return; // 🔥 congela todo
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Colisiones reales
    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {

            if (!circles[i].removing && !circles[j].removing) {

                if (areColliding(circles[i], circles[j])) {
                    resolveCollision(circles[i], circles[j]);
                }
            }
        }
    }

    circles.forEach(c => c.update());

    // 🔴 Solo eliminar definitivamente si fue clickeado
    circles = circles.filter(c => !(c.clicked && c.opacity <= 0));

    // Avanzar nivel solo si eliminó los 10
    if (score === currentLevel * circlesPerLevel) {

        if (currentLevel < 6) {
            currentLevel++;
            createLevel();
        }
    }

    // Termina solo si eliminó los 60
    if (score === totalCircles) {
        cancelAnimationFrame(animationId);
        document.getElementById("endScreen").classList.remove("d-none");
    }
}


// ======================= EVENTOS =======================

// Hover
canvas.addEventListener("mousemove", (e) => {

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    circles.forEach(c => {

        const dist = Math.hypot(mouseX - c.posX, mouseY - c.posY);

        if (dist < c.radius) {
            c.color = "orange";
        } else {
            c.color = c.baseColor;
        }
    });
});

// Click
canvas.addEventListener("click", (e) => {
    if (isPaused) return; // 🔥 no permite sumar puntos

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    circles.forEach(c => {

        const dist = Math.hypot(mouseX - c.posX, mouseY - c.posY);
        /* 
                if (dist < c.radius && !c.removing) { */
        if (dist < c.radius + 6 && !c.removing) {

            /* c.removing = true;
            c.clicked = true;

            score++;
            scoreText.textContent = score;

            let percent = Math.floor((score / totalCircles) * 100);
            progressText.textContent = percent + "%"; */
            c.removing = true;
            c.clicked = true;
            c.escape = false;

            score++;
            scoreText.textContent = score;

           /*  let percent = Math.floor((score / totalCircles) * 100);
            progressText.textContent = percent + "%"; */

            let percent = Math.floor((score / totalCircles) * 100);

            progressBar.style.width = percent + "%";
            progressBar.textContent = percent + "%";
        }
    });
});


startBtn.addEventListener("click", () => {
    document.getElementById("startScreen").classList.add("d-none");
    document.getElementById("gameInfo").classList.remove("d-none");
    createLevel();
    updateGame();
});


/* function resetGame() {

    cancelAnimationFrame(animationId);

    score = 0;
    currentLevel = 1;

    scoreText.textContent = 0;
    levelText.textContent = 1;

    progressBar.style.width = "0%";
    progressBar.textContent = "0%";

    circles = [];

    document.getElementById("endScreen").classList.add("d-none");

    createLevel();
    updateGame();
}

resetBtn.addEventListener("click", resetGame); */

resetBtn.addEventListener("click", () => {
    location.reload(); // 🔥 refresca la página
});

pauseBtn.addEventListener("click", () => {

    isPaused = !isPaused;

    if (isPaused) {
        pauseBtn.textContent = "▶ Reanudar";
        pauseBtn.classList.remove("btn-warning");
        pauseBtn.classList.add("btn-success");
    } else {
        pauseBtn.textContent = "⏸ Pausar";
        pauseBtn.classList.remove("btn-success");
        pauseBtn.classList.add("btn-warning");
    }
});