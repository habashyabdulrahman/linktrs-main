document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.getElementById("background-toggle");

    toggleButton.addEventListener("click", function () {
        const currentColor = document.body.style.backgroundColor;
        if (currentColor === "rgb(24, 26, 27)" || currentColor === "") {
            document.body.style.backgroundColor = "#f8f8f8";
            document.documentElement.style.setProperty('--primary-color', '#000');
            changeSVGColor('#000'); // تغيير لون SVG
        } else {
            document.body.style.backgroundColor = "#181A1B";
            document.documentElement.style.setProperty('--primary-color', '#fff');
            changeSVGColor('#fff'); // تغيير لون SVG
        }
    });

    function changeSVGColor(color) {
        const svgPaths = document.querySelectorAll('.svg-path');
        svgPaths.forEach(path => {
            path.setAttribute('fill', color);
        });
    }
});
