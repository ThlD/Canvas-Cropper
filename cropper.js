(function () {
    'use strict';

    const RESIZE_CONTROL_SIZE = 10;

    let cropData = {
        radius: 0,
        x: 0,
        y: 0,
    },
        canvas = document.getElementById('imagePreview'),
        cropCanvas = document.createElement('canvas'),
        mode = null,
        changeMade = false,
        frameRequest;

    document.forms.fileChooser.elements.file.addEventListener('change', function () {
        this.blur();
        let file = this.files[0];
        if (file) {
            cancelAnimationFrame(frameRequest);
            loadImage(file).then(function (image) {
                cropData.radius = Math.min(image.width, image.height) / 6;
                cropData.x = image.width / 2;
                cropData.y = image.height / 2;
                canvas.width = cropCanvas.width = image.width;
                canvas.height = cropCanvas.height = image.height;
                changeMade = true;
                render(image);

            });
        }
    });

    document.forms.saveForm.addEventListener('submit', function (event) {
        event.preventDefault();
        let fileName = this.elements.fileName.value + '.png';

        let saveCanvas = document.createElement('canvas'),
        width = saveCanvas.width = cropData.radius * 2,
        height = saveCanvas.height = cropData.radius * 2,
            {x, y, radius} = cropData;

        let context = saveCanvas.getContext('2d');
        context.clearRect(0, 0, width, height);
        context.drawImage(canvas, x - radius, y - radius, width, height, 0, 0, width, height);
        context.globalCompositeOperation = 'destination-in';
        context.beginPath();
        context.arc(radius, radius, radius, 0, 2*Math.PI);
        context.closePath();
        context.fill();

        saveCanvas.toBlob(function (blob) {
            let a = document.createElement('a');
            a.download = fileName;
            a.href = URL.createObjectURL(blob);
            a.dispatchEvent(new MouseEvent('click'));
            URL.revokeObjectURL(a.href);
        })
    });

    canvas.addEventListener('mousedown', function (event) {
        let x = event.offsetX,
            y = event.offsetY;

        if (isResizeMode(x, y)) {
            mode = 'resize';
        } else {
            mode = 'move';
        }

    });

    canvas.addEventListener('mousemove', function (event) {
        if (mode === 'resize') {
            cropData.radius = Math.abs(event.offsetX - cropData.x);
            changeMade = true;
        } else if (mode === 'move') {
            cropData.x = event.offsetX;
            cropData.y = event.offsetY;
            changeMade = true;
        }
    });

    canvas.addEventListener('mouseup', function () {
        mode = null;
    });


    function isResizeMode(x,y) {
        let leftSide = cropData.x - cropData.radius,
            rightSide = cropData.x + cropData.radius;
        return cropData.y - RESIZE_CONTROL_SIZE <= y &&
            y <= cropData.y + RESIZE_CONTROL_SIZE &&
            (leftSide - RESIZE_CONTROL_SIZE <= x &&
            x <= leftSide + RESIZE_CONTROL_SIZE ||
            rightSide - RESIZE_CONTROL_SIZE <= x &&
            x <= rightSide + RESIZE_CONTROL_SIZE)
    }

    function loadImage(file) {
        return new Promise(function (resolve) {
            let image = new Image();
            image.addEventListener('load', function listener() {
                image.removeEventListener('load', listener);
                URL.revokeObjectURL(image.src);
                resolve(image);
            });
            image.src = URL.createObjectURL(file)
        })
    }

    function render(image) {
        let width = image.width,
        height = image.height,
        context = canvas.getContext('2d'),
        cropContext = cropCanvas.getContext('2d');

        frameRequest = requestAnimationFrame(function () {
            if (changeMade) {
                context.clearRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);
                cropContext.save();
                cropContext.clearRect(0, 0, width, height);
                cropContext.fillStyle = 'rgba(0,0,0,0.5)';
                cropContext.fillRect(0, 0, width, height);
                cropContext.globalCompositeOperation = 'destination-out';
                cropContext.fillStyle = '#fff';
                cropContext.beginPath();
                cropContext.arc(cropData.x, cropData.y, cropData.radius, 0, 2*Math.PI);
                cropContext.closePath();
                cropContext.fill();
                cropContext.restore();

                context.drawImage(cropCanvas, 0, 0, width, height);

                changeMade = false;
            }
            render(image);
        });
    }
}());
