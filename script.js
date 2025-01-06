const imageUploader = document.getElementById('imageUploader');
// const canvas = document.getElementById('canvas');
const canvas =document.createElement('canvas');
const ctx = canvas.getContext('2d');
const borderSizeInput = document.getElementById('newWidth');
const borderSizeInput2 = document.getElementById('newHeight');
const borderColorInput = document.getElementById('borderColor');
const borderRadiusInput = document.getElementById('borderRadius');
var result;
var parameterDict;

var newWidth=7000;
var newHeight=7000;
var borderColor="#ffffff";
var borderRadius=40;
borderSizeInput.addEventListener('input', () => {
    newWidth = Number(borderSizeInput.value) || 7000; 
});

borderSizeInput2.addEventListener('input', () => {
    newHeight = Number(borderSizeInput2.value) || 7000; 
});

borderColorInput.addEventListener('input', () => {
    borderColor = borderColorInput.value || "#ffffff"; 
});
  borderRadiusInput.addEventListener('input', () => {
    borderRadius = Number(borderRadiusInput.value);
  });
var img;
const resetImage = () => {
    if (img.src) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    }
  };
imageUploader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                result=canvasToImage()
                parameterDict= await getImgExif(img);
                console.log(parameterDict);
                if (parameterDict.DateTimeOriginal) {
                    const dateParts = parameterDict.DateTimeOriginal.split(' '); // 拆分日期和时间
                    if (dateParts.length === 2) {
                        const [date, time] = dateParts;
                        const formattedDate = date.replace(/:/g, '-'); // 替换日期中的冒号为短横线
                        parameterDict.DateTimeOriginal = `${formattedDate}T${time}`;
                    } else {
                        parameterDict.DateTimeOriginal = null; // 如果解析失败，设置为 null
                    }
                }
                document.getElementById('lensModel').value = parameterDict.LensModel;
                document.getElementById('model').value = parameterDict.Model;
                document.getElementById('focalLength').value = parameterDict.FocalLength;
                document.getElementById('fNumber').value = parameterDict.FNumber;
                document.getElementById('exposureTime').value = parameterDict.ExposureTime;
                document.getElementById('isoSpeedRatings').value = parameterDict.ISOSpeedRatings;
                document.getElementById('make').value = parameterDict.Make;
                document.getElementById('dateTimeOriginal').value = parameterDict.DateTimeOriginal;
            };
        };
        reader.readAsDataURL(file);
        
    }
    
});

document.getElementById('addWhiteBorder').addEventListener('click', () => {
    addWhiteBorder();
});

document.getElementById('addBlurredBackground').addEventListener('click', () => {
    addBlurredBackground();
});

document.getElementById('addDominantColor').addEventListener('click', () => {
    addDominantColorBackground();
});

document.getElementById('saveImage').addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = 'processed_image.jpeg';
    // link.href = canvas.toDataURL("image/jpeg", 1.0);
    link.href=result.src;
    link.click();
});
function canvasToImage() {
    //新Image对象，可以理解为DOM
    var image1 = new Image();
    // canvas.toDataURL 返回的是一串Base64编码的URL，当然,浏览器自己肯定支持
    // 指定格式 PNG
    image1.src = canvas.toDataURL("image/jpeg", 1.0);
    let code = document.getElementById("imageContainer")
    while (code.firstChild) {
        code.removeChild(code.firstChild);
    }
    code.appendChild(image1);//img加入到要插入的容器id
    return image1;
}
function addWhiteBorder() {
    resetImage()
    // const newWidth = canvas.width + borderSize;
    // const newHeight = canvas.height + borderSize;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    tempCtx.fillStyle = borderColor;
    tempCtx.fillRect(0, 0, newWidth, newHeight);
    tempCtx.drawImage(canvas, (newWidth-img.width)/2, (newHeight-img.height)/2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(tempCanvas, 0, 0);
    result=canvasToImage()
}

function addBlurredBackground() {
    resetImage()
    const originWidth = canvas.width;
    const originalHeight = canvas.height;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = canvas.width * 2;
    tempCanvas.height = canvas.height * 2;

    tempCtx.filter = `blur(${borderRadius}px)`;
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // canvas.width = tempCanvas.width;
    // canvas.height = tempCanvas.height;
    // ctx.drawImage(tempCanvas, 0, 0);
    // ctx.drawImage(img, (tempCanvas.width-originWidth) / 2, (tempCanvas.height-originalHeight) / 2);

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(tempCanvas,(tempCanvas.width-newWidth) / 2, (tempCanvas.height-newHeight) / 2,newWidth,newHeight,0,0,newWidth,newHeight);
    ctx.drawImage(img, (newWidth-originWidth) / 2, (newHeight-originalHeight) / 2);
    result=canvasToImage()
    
}


function addDominantColorBackground() {
    resetImage()
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const colorCounts = {};

    for (let i = 0; i < pixels.length; i += 4) {
        const rgb = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
        colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
    }

    const dominantColor = Object.keys(colorCounts).reduce((a, b) => (colorCounts[a] > colorCounts[b] ? a : b)).split(',');
    const [r, g, b] = dominantColor.map(Number);

    // const newWidth = canvas.width + borderSize;
    // const newHeight = canvas.height + borderSize;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    tempCtx.fillStyle = `rgb(${r},${g},${b})`;
    tempCtx.fillRect(0, 0, newWidth, newHeight);
    tempCtx.drawImage(canvas, (newWidth-img.width)/2, (newHeight-img.height)/2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(tempCanvas, 0, 0);
    result=canvasToImage()
}
async function getImgExif(imageFile) {
    return new Promise((resolve) => {
        EXIF.getData(imageFile, function () {
            const exifData = EXIF.getAllTags(this);
            console.log(exifData);
            resolve({
                LensModel: exifData.LensModel,
                Model: exifData.Model,
                FocalLength: exifData.FocalLength ? `${exifData.FocalLength}` : "N/A",
                FNumber: exifData.FNumber,
                ExposureTime: exifData.ExposureTime,
                ISOSpeedRatings: exifData.ISOSpeedRatings,
                Make: exifData.Make,
                DateTimeOriginal: exifData.DateTimeOriginal,
            });
        });
    });
}
function generateImage() {
    resetImage()
    const form = document.getElementById('parameterForm');
    const formData = new FormData(form);

    const parameters = {
        LensModel: formData.get('lensModel'),
        Model: formData.get('model'),
        FocalLength: parseFloat(formData.get('focalLength')),
        FNumber: parseFloat(formData.get('fNumber')),
        ExposureTime: parseFloat(formData.get('exposureTime')),
        ISOSpeedRatings: parseInt(formData.get('isoSpeedRatings')),
        Make: formData.get('make').split(' ')[0].toLowerCase(),
        DateTimeOriginal: formData.get('dateTimeOriginal'),
    };


    const width = canvas.width;
    const height = canvas.height;
    const watermarkHeight = Math.ceil(Math.min(width, height) * 0.1);
    const background_borderSize = Math.ceil(Math.max(width, height) * 0.05);
    const self_adative_roit=Math.ceil(width*height/(4000*5000)*0.4)
    canvas.width = width+background_borderSize;
    canvas.height = height + watermarkHeight+background_borderSize/2;
    
    // Draw watermark background
    ctx.fillStyle = '#FFFFFF';
    // ctx.fillRect(0, height, width, watermarkHeight);
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw original image
    ctx.drawImage(img, background_borderSize/2, background_borderSize/2);

    
    // Draw text parameters
    const boldsize= Math.floor(100*self_adative_roit);
    const regularsize=Math.floor(80*self_adative_roit);
    const boldFont = `bold ${boldsize}px Arial`;
    const regularFont = `${regularsize}px Arial`;
    ctx.font = boldFont;
    ctx.fillStyle = 'black';

    ctx.fillText(
        parameters.LensModel,
        Math.floor(watermarkHeight*0.2)+background_borderSize/2, 
        height +  Math.floor(watermarkHeight*0.35)+background_borderSize/2
    );
    const shooting_parameter=`${parameters.FocalLength}mm f/${parameters.FNumber} ${parameters.ExposureTime}s ISO${parameters.ISOSpeedRatings}`;
    const shooting_parameter_text_width= ctx.measureText(shooting_parameter).width
    ctx.fillText(
        shooting_parameter,
        canvas.width-shooting_parameter_text_width-Math.floor(watermarkHeight*0.2)-background_borderSize/2,
        Math.floor(  height +  watermarkHeight*0.35)+background_borderSize/2
    );

    ctx.font = regularFont;
    ctx.fillStyle = 'gray';
    ctx.fillText(
        parameters.Model, 
        Math.floor(watermarkHeight*0.2)+background_borderSize/2, 
        height + watermarkHeight/1.5+ 10* self_adative_roit+background_borderSize/2
    );
    const shooting_time_text_width= ctx.measureText(parameters.DateTimeOriginal).width
    ctx.fillText(
        parameters.DateTimeOriginal.replace('T', ' '), 
        canvas.width-shooting_time_text_width-Math.floor(watermarkHeight*0.2)-background_borderSize/2, 
        height + watermarkHeight/1.5+ 10* self_adative_roit + background_borderSize/2
    );

    // Example logo (Replace with dynamic logo handling if needed)
    const logo = new Image();
    logo.crossOrigin = "anonymous";
    logo.src = `https://cdn.jsdelivr.net/gh/AtomChen0425/picx-images-hosting@master/logos/${parameters.Make}.png`; // Placeholder logo
    logo.onload = () => {
        const scale = watermarkHeight * 0.6 / logo.height;
        const logoWidth = logo.width * scale;
        const logoHeight = logo.height * scale;
    
        ctx.drawImage(logo,
            canvas.width - shooting_parameter_text_width - Math.floor(70*self_adative_roit) -Math.floor(watermarkHeight*0.2)-Math.floor(logoWidth)-background_borderSize/2,
            height + Math.floor(watermarkHeight *0.2)+background_borderSize/2.5 ,
            logoWidth,
            logoHeight);
        console.log('draw logo')
        console.log(logo.src)
        result=canvasToImage()
    };
    
    // await new Promise((resolve) => {
    //     logo.onload = resolve;
    // });
    // const scale = watermarkHeight * 0.6 / logo.height;
    // const logoWidth = logo.width * scale;
    // const logoHeight = logo.height * scale;
    // ctx.drawImage(logo, width - shooting_parameter_text_width - Math.floor(70*self_adative_roit) -Math.floor(watermarkHeight*0.9), height + Math.floor(watermarkHeight *0.2) , logoWidth, logoHeight);
    
}





