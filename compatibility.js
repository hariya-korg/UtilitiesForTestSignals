
(function(){
    window.audioCtx = window.AudioContext || window.webkitAudioContext;

    navigator.getUserMedia =
        navigator.getUserMedia ||
        navigator.webkitGetUserMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    window.URL = window.URL || window.webkitURL;
})();
