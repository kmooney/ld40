/* global HUD */
window.HUD = (function() {
    "use strict";

    function inflate(element) {
        element.style.display = 'block';
        element.style.position = 'absolute';
        element.style.width = "100%";
        element.style.height = "100%";
        element.style.top = 0;
        element.style.left = 0;
    }
    var container = document.getElementById('container');
    var hud = document.createElement("div");
    var title = document.createElement("div");
    var tutorial = document.createElement("div");
    var okToGo = document.createElement("div");
    var pressAKey = document.createElement('p');
    var myScore = 0;
    var timeLeft = 60;
    var almostReady = false;
    var showingTutorial = false;
    var showingTitle = false;
    var callback = null;

    var inControl = true;
    title.style.background="rgba(0, 0, 0, 0) url('../assets/title.png') no-repeat scroll 50% 20%";
    inflate(title);
    inflate(hud);
    inflate(tutorial);
    inflate(okToGo);
    
    pressAKey.innerText = "Press a key to start";
    pressAKey.style.position = 'absolute';
    pressAKey.style.color = "white";
    pressAKey.style['text-align'] = 'center';
    pressAKey.style['font-family'] = 'Helvetical, Arial, sans-serif';
    pressAKey.style['font-size'] = '72px';

    okToGo.appendChild(pressAKey);
    tutorial.style.background="rgba(0, 0, 0, 0) url('../assets/pirate-info.png') no-repeat scroll 50% 20%";

    var visible = true;
    
    hud.style['z-index'] = '800';
    container.insertAdjacentElement('beforebegin', hud);

    window.addEventListener('resize', function() {
        pressAKey.style.left = (window.innerWidth / 2.0 - pressAKey.offsetWidth / 2.0) + "px";
        pressAKey.style.top = "30%";
    });

    window.addEventListener('keypress', function() {
        
        if (!inControl) {
            return false;
        }
        
        if (almostReady) {
            HUD.hidePrompt();
            HUD.hideTitle();
            HUD.showTutorial();
            almostReady = false;
        } else if (showingTutorial) {
            HUD.hideTutorial();
            inControl = false;
            // return control to game
            if (typeof callback !== 'undefined') {
                callback();
            }
        }
    });
    
    return {
        showTitle: function() {
            hud.appendChild(title);
            showingTitle = true;
        },
        hideTitle: function() {
            if (showingTitle) {
                hud.removeChild(title);
            }
        },
        showTutorial: function() {
            hud.appendChild(tutorial);
            showingTutorial = true;
        },
        hideTutorial: function() {
            hud.removeChild(tutorial);
            showingTutorial = false;
        },
        showClock: function() {
            hud.appendChild(clock);
        },
        hideClock: function() {
            hud.removeChild(clock);
        },
        showScore: function() {
            hud.appendChild(score);
        },
        hideScore: function() {
            hud.removeChild(score);
        },
        updateScore: function(how_much) {
            myScore = how_much;
        },
        updateClock: function(how_much) {
            timeLeft = how_much;
        },
        visible: function() {
            return visible;
        },
        inControl: function() {
            return inControl;
        },
        readyToPlay: function(cal) {
            hud.appendChild(okToGo);
            pressAKey.style.left = (window.innerWidth / 2.0 - pressAKey.offsetWidth / 2.0) + "px";
            pressAKey.style.top = "30%";
            almostReady = true;
            callback = cal;
        },
        hidePrompt: function() {
            hud.removeChild(okToGo);
        }
    };
})();
