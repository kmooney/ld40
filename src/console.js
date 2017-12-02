/* Globals console */
/* Exports shipsLog */
window.ShipsLog = 
(function() {
    "use strict";
    var americanDateTime = new Intl.DateTimeFormat('en-US', {
        year: '2-digit', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }
    ).format;

    var container = document.getElementById('container');
    var console = document.createElement('div');
    var visible = false;
    container.insertAdjacentElement('beforebegin', console);
    console.style.display = "none";
    return {
        log: function(str) {
            var msg = document.createElement('pre');
            var stamp = americanDateTime(new Date());
            msg.innerText = "[" + stamp + "] "+ str;
            msg.style.color = '#00aaff';
            msg.style.display = 'inherit';

            console.appendChild(msg);
            console.scrollTop = console.clientHeight;
        },
        show: function() {
            console.style.display = "block";
            console.style.position = "absolute";
            console.style.width = "100%";
            console.style.height = "20%";
            console.style.top = 0;
            console.style.background = "white";
            console.style['z-index'] = '999';
            console.style.opacity = "0.3";
            console.style.overflow = "scroll";
            visible = true;
        },
        hide: function() {
            console.style.display = "none";
            visible = false;
        },
        visible: function() {
            return visible;
        }
    };
})();