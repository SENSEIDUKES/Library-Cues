const { spawn } = require("child_process");
const fs = require("fs");

function fadeAudio(audioBuffer, mimeType, fadeInDur, fadeOutDur) {
    return new Promise((resolve, reject) => {
        const filters = [];
        if (fadeInDur > 0) {
            filters.push(`afade=t=in:d=${fadeInDur}`);
        }
        if (fadeOutDur > 0) {
            filters.push(`areverse`, `afade=t=in:d=${fadeOutDur}`, `areverse`);
        }
        
        let filterStr = filters.join(",");
        let args = ["-i", "pipe:0"];
        if (filterStr) {
            args.push("-af", filterStr);
        }
        args.push("-f", "mp3", "pipe:1");

        const ffmpeg = spawn("ffmpeg", args);

        const chunks = [];
        ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
        
        let errOutput = "";
        ffmpeg.stderr.on("data", (data) => errOutput += data.toString());

        ffmpeg.on("close", (code) => {
            if (code === 0) {
                resolve(Buffer.concat(chunks));
            } else {
                reject(new Error(`ffmpeg error ${code}: ${errOutput}`));
            }
        });

        ffmpeg.stdin.write(audioBuffer);
        ffmpeg.stdin.end();
    });
}
