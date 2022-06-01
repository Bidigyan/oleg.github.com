'use strict';

class Level {
    getLevel(score) {
        let level = 0;
        this.data().forEach(function (cfg) {
            if (score >= cfg.score) {
                level++;
            } else {
                return;
            }
        });
        return level;
    }

    getLevelCfg(level) {
        return this.data()[level-1];
    }

    data() {
        return [
            {
                "score" : 0,
                "matrix" : {
                    "h" : 3,
                    "w" : 3
                },
                "generator" : {
                    "min" : 1,
                    "max" : 20
                }
            },
            {
                "score" : 20,
                "matrix" : {
                    "h" : 4,
                    "w" : 4
                },
                "generator" : {
                    "min" : 3,
                    "max" : 30
                }
            },
            {
                "score" : 50,
                "matrix" : {
                    "h" : 5,
                    "w" : 5
                },
                "generator" : {
                    "min" : 10,
                    "max" : 99
                }
            }
        ];
    }
}

class Matrix {
    #table;
    #activeButton;
    #h;
    #w;
    #goal;
    #min;
    #max;

    constructor() {
        this.#table = $('#table');
        this.#setEvents();
        this.#activeButton = [];
    }

    setDimension(h, w) {
        this.#h = h;
        this.#w = w;
    }

    setGoal(goal) {
        this.#goal = goal;
    }

    setMinMax(min, max) {
        this.#min = min;
        this.#max = max;
    }

    addActiveButton(btn) {
        if (this.getActiveButtonNumber() < 2) {
            this.#activeButton.push(btn);
            btn.addClass('active');
        } else {
            console.log('Нажато больше двух кнопок.');
            return;
        }

        switch (this.getActiveButtonNumber()) {
            case 1:
                this.#highlight();
                break;
            case 2:
                // this.reset();
                break;
            default:
        }
    }

    build() {
        this.#table.html('');

        let index = 0;
        for (let i = 1; i <= this.#h; i++) {
            let tr = $('<tr>');
            for (let u = 1; u <= this.#w; u++){
                ++index;
                let button = $('<button class="butt" data-index="' + index + '"></button>');
                let td = $('<td>').append(button);
                tr.append(td);
            }
             tr.appendTo(this.#table);
        }
    }

    getActiveButtonNumber() {
        return this.#activeButton.length;
    }

    reset() {
        $('button')
            .removeClass('active')
            .removeClass('hover')
            .removeClass('highlight')
            .removeClass('disabled')
            .removeClass('hl')
            .prop('disabled', false)
            let level = 0;
        ;
        this.#activeButton.length = 0
        this.fill();
    }

    fill() {
        let ctx = this;
        $('button', this.#table).each(function(){
            $(this).text(Generator.emit(ctx.#min, ctx.#max));
        });

        let rCell = Generator.emit(1, this.#w * this.#h);
        let firstPart = Generator.emit(1, this.#goal - 1);
        let secondPart = this.#goal - firstPart;
        let n = this.#getNeighbors(rCell);
        let nCell = n[Generator.emit(0, n.length - 1)];

        $('button[data-index="' + rCell + '"]').addClass('hl').text(firstPart);
        $('button[data-index="' + nCell + '"]').addClass('hl').text(secondPart);
    }

    #getColNum(index) {
        let n = index % this.#w;
        if (n === 0) {
            return this.#w;;
        }
        return n;
    }

    #getRowNum(index) {
        return Math.ceil(index / this.#h);
    }

    #getCoords(index) {
        return {
            'x' : this.#getRowNum(index),
            'y' : this.#getColNum(index)
        };
    }

    #getNeighbors(idx) {
        let out = []

        let l = idx - 1;
        let r = idx + 1;
        let u = idx - this.#w;
        let d = idx + this.#w;

        if (this.#getRowNum(l) === this.#getRowNum(idx)) {
            out.push(l);
        }

        if (this.#getRowNum(r) === this.#getRowNum(idx)) {
            out.push(r);
        }

        if (u > 0) {
            out.push(u);
        }

        if (d <= this.#h * this.#w) {
            out.push(d);
        }
        return out;
    }

    #isComparable(cell1, cell2) {
        var c1 = this.#getCoords(cell1.data('index'));
        var c2 = this.#getCoords(cell2.data('index'));

        var rowDiff = Math.abs(c1.x - c2.x);
        var colDiff = Math.abs(c1.y - c2.y);

        if (rowDiff > 1) {
            return false;
        }

        if (rowDiff == 1 && colDiff != 0) {
            return false;
        }

        if (rowDiff == 0 && colDiff != 1) {
            return false;
        }
        return true;
    }


    #highlight() {
        var activeButton = this.#activeButton[0];

        let ctx = this;
        $('button').each(function(){
            var btn = $(this);
            btn.removeClass('disabled');
            btn.removeClass('highlight');

            if (ctx.#isComparable(btn, activeButton)) {
                btn.addClass('highlight');
            }
            else {
                $(this).addClass('disabled');
                $(this).prop('disabled', true);
            }
        })
    }

    #setEvents() {
        this.#table.on('mouseover', 'button', function(){
            $(this).addClass('hover');
        });

        this.#table.on('mouseout', 'button', function(){
            $(this).removeClass('hover');
        });

        // button UI events
        this.#table.on('click', 'button', function(){
            Game.click($(this));
        });
    }

    getValue() {
        let a = $.map(this.#activeButton, function (i, e) {
            return parseInt($(i).text());
        });
        return a.reduce((p,c) => p + (parseFloat(c) || 0), 0);
    }
}

class GameController {
    #MatrixObject;
    #ScoreBoard;
    #LevelStore;
    #levelCfg;
    #level;

    #Goal;
    #score;

    constructor() {
        this.#MatrixObject = new Matrix();

        this.#ScoreBoard = new ScoreBoard();
        this.#score = this.#ScoreBoard.get();

        this.#LevelStore = new Level();
        this.#Goal = $('.goal');
        this.#level = this.#LevelStore.getLevel(this.#score);
        this.#levelCfg = this.#LevelStore.getLevelCfg(this.#level);
    }

    start() {
        let goal = Generator.emit(this.#levelCfg.generator.min * 2, this.#levelCfg.generator.max);
        this.#Goal.text(goal);
        this.#MatrixObject.setGoal(goal);
        this.#setLevel();
    }

    click(btn) {
        this.#MatrixObject.addActiveButton(btn);
        this.#checkResult();
    }

    #checkResult() {
        if (this.#MatrixObject.getActiveButtonNumber() != 2)  {
            return;
        }

        if (this.#MatrixObject.getValue() == parseInt(this.#Goal.text())) {
            this.#ScoreBoard.add();

            let checkLevel = this.#LevelStore.getLevel(this.#ScoreBoard.get());
            if (this.#level < checkLevel) {
                this.#level = checkLevel;
                this.#levelCfg = this.#LevelStore.getLevelCfg(this.#level);
                this.#setLevel();
            }
        }

        let goal = Generator.emit(this.#levelCfg.generator.min * 2, this.#levelCfg.generator.max);
        this.#Goal.text(goal);
        this.#MatrixObject.setGoal(goal);
        this.#MatrixObject.reset();
    }

    #setLevel() {
        this.#MatrixObject.setDimension(this.#levelCfg.matrix.h, this.#levelCfg.matrix.w);
        this.#MatrixObject.setMinMax(this.#levelCfg.generator.min, this.#levelCfg.generator.max);
        this.#MatrixObject.build();
        this.#MatrixObject.reset();
    }

 }

class ScoreBoard {
    #board;
    #score = 0

    constructor() {
        this.#board = $('.score');
        this.update();
    }

    update() {
        this.#board.text(this.#score);
    }

    add() {
        ++this.#score;
        this.update();
        if(this.#score == 5) {
            window.location.assign('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
        }
    }

    get() {
        return this.#score;
    }
}

class Generator {
    static emit(min, max) {
        var min = Math.floor(min);
        var max = Math.ceil(max);
        return Math.floor(Math.random() * (max-min) + min) + Math.round(Math.random());
    }
}

var Game = new GameController();
Game.start();

function getSum() {
    var s = 0;
    $('button.active', table).each(function(){
        s += parseInt($(this).text());
    });
    return s;
}