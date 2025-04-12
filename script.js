// 全局变量
const imageUploader = document.getElementById('imageUploader');
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const borderSizeInput = document.getElementById('newWidth');
const borderSizeInput2 = document.getElementById('newHeight');
const borderColorInput = document.getElementById('borderColor');
const borderRadiusInput = document.getElementById('borderRadius');
const loadingElement = document.getElementById('loading');
const infoCamera = document.getElementById('info-camera');
const infoLens = document.getElementById('info-lens');
const infoSettings = document.getElementById('info-settings');
const infoTime = document.getElementById('info-time');
const lcdAperture = document.getElementById('lcd-aperture');
const lcdIso = document.getElementById('lcd-iso');
const lcdexposureTime = document.getElementById('lcd-exposureTime');

let self_adative_roit;
let result;
let parameterDict;
let img;

// 默认值
let newWidth = 7000;
let newHeight = 7000;
let borderColor = "#ffffff";
let borderRadius = 40;

// 事件监听器
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

// 重置图像
const resetImage = () => {
    if (img && img.src) {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        // 添加取景器效果动画
        addViewfinderEffect();
    }
};

// 添加取景器效果动画
function addViewfinderEffect() {
    const viewfinderFrame = document.querySelector('.viewfinder-frame');
    viewfinderFrame.classList.add('focusing');
    
    setTimeout(() => {
        viewfinderFrame.classList.remove('focusing');
    }, 500);
}

// 更新LCD显示
function updateLCDDisplay() {
    let exposureTime1 = parameterDict.ExposureTime;
    if (exposureTime1 < 1) {
        exposureTime1 = `${parameterDict.ExposureTime.numerator}/${parameterDict.ExposureTime.denominator}`;
    }
    if (parameterDict) {
        // 更新光圈值
        if (parameterDict.FNumber) {
            lcdAperture.textContent = `F${parameterDict.FNumber}`;
        }
        
        // 更新ISO值
        if (parameterDict.ISOSpeedRatings) {
            lcdIso.textContent = `ISO ${parameterDict.ISOSpeedRatings}`;
        }
        // 更新曝光时间值
        if (exposureTime1) {
            lcdexposureTime.textContent = `${exposureTime1} s`;
        }
        // 更新隐藏表单中的值
        document.getElementById('fNumber').value = parameterDict.FNumber || '4.5';
        document.getElementById('isoSpeedRatings').value = parameterDict.ISOSpeedRatings || '1600';
        
        // 添加LCD屏幕更新动画效果
        const lcdPanel = document.querySelector('.lcd-panel');
        lcdPanel.classList.add('updating');
        setTimeout(() => {
            lcdPanel.classList.remove('updating');
        }, 300);
    }
}

// 图像上传处理
imageUploader.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        // 显示加载动画
        loadingElement.classList.add('active');
        
        img = new Image();
        const reader = new FileReader();
        
        reader.onload = (e) => {
            img.src = e.target.result;
            img.onload = async () => {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
                result = canvasToImage();
                
                // 获取EXIF数据
                parameterDict = await getImgExif(img);
                console.log(parameterDict);
                
                // 计算自适应比例
                self_adative_roit = Math.min(img.width, img.height) / 3500;
                
                // 处理日期时间格式
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
                
                // 处理曝光时间格式
                let exposureTime1 = parameterDict.ExposureTime;
                if (exposureTime1 < 1) {
                    exposureTime1 = `${parameterDict.ExposureTime.numerator}/${parameterDict.ExposureTime.denominator}`;
                }
                
                // 填充表单数据
                document.getElementById('lensModel').value = parameterDict.LensModel || 'Canon EF 50mm f/1.8';
                document.getElementById('model').value = parameterDict.Model || 'Canon EOS 5D';
                document.getElementById('focalLength').value = parameterDict.FocalLength || '50';
                document.getElementById('fNumber').value = parameterDict.FNumber || '4.5';
                document.getElementById('exposureTime').value = exposureTime1 || '1/125';
                document.getElementById('isoSpeedRatings').value = parameterDict.ISOSpeedRatings || '1600';
                document.getElementById('make').value = parameterDict.Make || 'Canon';
                document.getElementById('dateTimeOriginal').value = parameterDict.DateTimeOriginal || '';
                document.getElementById('Bold_font_size').value = Math.floor(90 * self_adative_roit);
                document.getElementById('Regular_font_size').value = Math.floor(70 * self_adative_roit);
                
                // 更新相机信息显示
                updateCameraInfo();
                
                // 更新LCD显示
                updateLCDDisplay();
                
                // 隐藏加载动画
                loadingElement.classList.remove('active');
                
                // 播放相机快门音效
                // playShutterSound();
            };
        };
        
        reader.readAsDataURL(file);
    }
});

// 更新相机信息显示
function updateCameraInfo() {
    if (parameterDict) {
        infoCamera.textContent = parameterDict.Model || 'N/A';
        infoLens.textContent = parameterDict.LensModel || 'N/A';
        
        let settings = '';
        if (parameterDict.FocalLength) settings += `${parameterDict.FocalLength}mm `;
        if (parameterDict.FNumber) settings += `f/${parameterDict.FNumber} `;
        if (parameterDict.ExposureTime) {
            let expTime = parameterDict.ExposureTime;
            if (expTime < 1) {
                expTime = `${parameterDict.ExposureTime.numerator}/${parameterDict.ExposureTime.denominator}s`;
            } else {
                expTime = `${expTime}s`;
            }
            settings += expTime + ' ';
        }
        if (parameterDict.ISOSpeedRatings) settings += `ISO${parameterDict.ISOSpeedRatings}`;
        
        infoSettings.textContent = settings || 'N/A';
        
        if (parameterDict.DateTimeOriginal) {
            const formattedDate = parameterDict.DateTimeOriginal.replace('T', ' ');
            infoTime.textContent = formattedDate;
        } else {
            infoTime.textContent = 'N/A';
        }
    }
}

// 播放相机快门音效
function playShutterSound() {
    const shutterSound = new Audio('https://freesound.org/data/previews/35/35214_18799-lq.mp3');
    shutterSound.volume = 0.5;
    shutterSound.play().catch(e => console.log('无法播放音效:', e));
}

// Canvas转图像
function canvasToImage() {
    var image1 = new Image();
    image1.src = canvas.toDataURL("image/jpeg", 1.0);
    
    let code = document.getElementById("imageContainer");
    while (code.firstChild) {
        code.removeChild(code.firstChild);
    }
    
    code.appendChild(image1);
    
    // 添加取景器效果
    addViewfinderEffect();
    
    return image1;
}

// 添加自定义颜色边框
function addWhiteBorder() {
    // 显示加载动画
    loadingElement.classList.add('active');
    
    setTimeout(() => {
        resetImage();
        
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
        
        result = canvasToImage();
        
        // 隐藏加载动画
        loadingElement.classList.remove('active');
        
        // // 播放相机快门音效
        // playShutterSound();
    }, 300);
}

// 添加模糊背景
function addBlurredBackground() {
    // 显示加载动画
    loadingElement.classList.add('active');
    
    setTimeout(() => {
        resetImage();
        
        const originWidth = canvas.width;
        const originalHeight = canvas.height;
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = canvas.width * 2;
        tempCanvas.height = canvas.height * 2;

        tempCtx.filter = `blur(${borderRadius}px)`;
        tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = newWidth;
        canvas.height = newHeight;
        ctx.drawImage(tempCanvas, (tempCanvas.width-newWidth) / 2, (tempCanvas.height-newHeight) / 2, newWidth, newHeight, 0, 0, newWidth, newHeight);
        ctx.drawImage(img, (newWidth-originWidth) / 2, (newHeight-originalHeight) / 2);
        
        result = canvasToImage();
        
        // 隐藏加载动画
        loadingElement.classList.remove('active');
        
        // // 播放相机快门音效
        // playShutterSound();
    }, 300);
}

// 添加主色调背景
function addDominantColorBackground() {
    // 显示加载动画
    loadingElement.classList.add('active');
    
    setTimeout(() => {
        resetImage();
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const colorCounts = {};

        // 采样像素（为了提高性能，每10个像素采样一次）
        for (let i = 0; i < pixels.length; i += 40) {
            const rgb = `${pixels[i]},${pixels[i + 1]},${pixels[i + 2]}`;
            colorCounts[rgb] = (colorCounts[rgb] || 0) + 1;
        }

        const dominantColor = Object.keys(colorCounts).reduce((a, b) => (colorCounts[a] > colorCounts[b] ? a : b)).split(',');
        const [r, g, b] = dominantColor.map(Number);

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
        
        result = canvasToImage();
        
        // 隐藏加载动画
        loadingElement.classList.remove('active');
        
        // 播放相机快门音效
        // playShutterSound();
    }, 300);
}

// 获取图像EXIF数据
async function getImgExif(imageFile) {
    return new Promise((resolve) => {
        EXIF.getData(imageFile, function () {
            const exifData = EXIF.getAllTags(this);
            console.log(exifData);
            resolve({
                LensModel: exifData.LensModel || 'None',
                Model: exifData.Model || 'Canon EOS 5D',
                FocalLength: exifData.FocalLength ? `${exifData.FocalLength}` : "50",
                FNumber: exifData.FNumber || '4.5',
                ExposureTime: exifData.ExposureTime || '1/125',
                ISOSpeedRatings: exifData.ISOSpeedRatings || '1600',
                Make: exifData.Make || 'Canon',
                DateTimeOriginal: exifData.DateTimeOriginal || '',
            });
        });
    });
}

// 生成带参数的图像
function generateImage() {
    // 显示加载动画
    loadingElement.classList.add('active');
    // 更新LCD显示
    updateLCDDisplay();
    setTimeout(() => {
        resetImage();
        
        const form = document.getElementById('parameterForm');
        const formData = new FormData(form);

        const parameters = {
            LensModel: formData.get('lensModel'),
            Model: formData.get('model'),
            FocalLength: parseFloat(formData.get('focalLength')),
            FNumber: parseFloat(formData.get('fNumber')),
            ExposureTime: formData.get('exposureTime'),
            ISOSpeedRatings: parseInt(formData.get('isoSpeedRatings')),
            Make: formData.get('make').split(' ')[0].toLowerCase(),
            DateTimeOriginal: formData.get('dateTimeOriginal'),
        };

        const width = canvas.width;
        const height = canvas.height;
        const watermarkHeight = Math.ceil(Math.min(width, height) * 0.1);
        const background_borderSize = Math.ceil(Math.max(width, height) * 0.05);
        
        canvas.width = width + background_borderSize;
        canvas.height = height + watermarkHeight + background_borderSize/2;
        
        // 绘制背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制原始图像
        ctx.drawImage(img, background_borderSize/2, background_borderSize/2);
        
        // 绘制文本参数
        const boldsize = Math.floor(formData.get("Bold_font_size"));
        const regularsize = Math.floor(formData.get("Regular_font_size"));
        const boldFont = `bold ${boldsize}px Arial`;
        const regularFont = `${regularsize}px Arial`;
        
        ctx.font = boldFont;
        ctx.fillStyle = 'black';

        ctx.fillText(
            parameters.LensModel,
            Math.floor(watermarkHeight*0.2) + background_borderSize/2, 
            height + Math.floor(watermarkHeight*0.4) + background_borderSize/2
        );
        
        const shooting_parameter = `${parameters.FocalLength}mm f/${parameters.FNumber} ${parameters.ExposureTime}s ISO${parameters.ISOSpeedRatings}`;
        const shooting_parameter_text_width = ctx.measureText(shooting_parameter).width;
        
        ctx.fillText(
            shooting_parameter,
            canvas.width - shooting_parameter_text_width - Math.floor(watermarkHeight*0.2) - background_borderSize/2,
            Math.floor(height + watermarkHeight*0.4) + background_borderSize/2
        );

        ctx.font = regularFont;
        ctx.fillStyle = 'gray';
        
        ctx.fillText(
            parameters.Model, 
            Math.floor(watermarkHeight*0.2) + background_borderSize/2, 
            height + watermarkHeight/1.5 + 10 * self_adative_roit + background_borderSize/2
        );
        
        const shooting_time_text_width = ctx.measureText(parameters.DateTimeOriginal).width;
        
        ctx.fillText(
            parameters.DateTimeOriginal.replace('T', ' '), 
            canvas.width - shooting_parameter_text_width - Math.floor(watermarkHeight*0.2) - background_borderSize/2, 
            height + watermarkHeight/1.5 + 10 * self_adative_roit + background_borderSize/2
        );
        
        ctx.strokeStyle = '#808080'; 
        ctx.lineWidth = 10 * self_adative_roit;

        ctx.beginPath();
        ctx.moveTo(
            canvas.width - shooting_parameter_text_width - Math.floor(watermarkHeight*0.2) - background_borderSize/2 - 30 * self_adative_roit,
            height + Math.floor(watermarkHeight *0.2) + background_borderSize/2.2
        );
        ctx.lineTo(
            canvas.width - shooting_parameter_text_width - Math.floor(watermarkHeight*0.2) - background_borderSize/2 - 30 * self_adative_roit,
            height + Math.floor(watermarkHeight *0.2) + background_borderSize/2.2 + Math.floor(watermarkHeight *0.7)
        );
        ctx.stroke();
        
        // 加载品牌logo
        const logo = new Image();
        logo.crossOrigin = "anonymous";
        logo.src = `https://cdn.jsdelivr.net/gh/AtomChen0425/picx-images-hosting@master/logos/${parameters.Make}.png`;
        
        logo.onload = () => {
            const scale = watermarkHeight * 0.6 / logo.height;
            const logoWidth = logo.width * scale;
            const logoHeight = logo.height * scale;
        
            ctx.drawImage(
                logo,
                canvas.width - shooting_parameter_text_width - Math.floor(70 * self_adative_roit) - Math.floor(watermarkHeight*0.2) - Math.floor(logoWidth) - background_borderSize/2,
                height + Math.floor(watermarkHeight *0.2) + background_borderSize/2,
                logoWidth,
                logoHeight
            );
            
            console.log('draw logo');
            console.log(logo.src);
            
            result = canvasToImage();
            
            // 隐藏加载动画
            loadingElement.classList.remove('active');
            
            // // 播放相机快门音效
            // playShutterSound();
        };
        
        logo.onerror = () => {
            console.error('Logo加载失败');
            result = canvasToImage();
            
            // 隐藏加载动画
            loadingElement.classList.remove('active');
            
            // // 播放相机快门音效
            // playShutterSound();
        };
    }, 300);
}

// 保存图像
document.getElementById('saveImage').addEventListener('click', () => {
    if (!result) {
        alert('请先处理图像');
        return;
    }
    
    const link = document.createElement('a');
    link.download = 'processed_image.jpeg';
    link.href = result.src;
    link.click();
    
    // 添加保存成功提示
    const saveNotification = document.createElement('div');
    saveNotification.textContent = '图像已保存';
    saveNotification.style.position = 'fixed';
    saveNotification.style.bottom = '20px';
    saveNotification.style.left = '50%';
    saveNotification.style.transform = 'translateX(-50%)';
    saveNotification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    saveNotification.style.color = 'white';
    saveNotification.style.padding = '10px 20px';
    saveNotification.style.borderRadius = '5px';
    saveNotification.style.zIndex = '1000';
    
    document.body.appendChild(saveNotification);
    
    setTimeout(() => {
        document.body.removeChild(saveNotification);
    }, 2000);
});

// LCD面板交互
document.querySelectorAll('.lcd-item').forEach(item => {
    item.addEventListener('click', function() {
        // 如果点击的是已经激活的项目，则取消激活
        if (this.classList.contains('active')) {
            this.classList.remove('active');
        } else {
            // 否则激活当前项目
            this.classList.add('active');
        }
        
        // 播放按钮音效
        const clickSound = new Audio('https://freesound.org/data/previews/522/522588_10058132-lq.mp3');
        clickSound.volume = 0.3;
        clickSound.play().catch(e => console.log('无法播放音效:', e));
    });
});
// 定义一个函数toggleForm，用于切换参数表单的显示和隐藏
function toggleForm() {
    // 获取参数表单元素
    const form = document.getElementById('parameterForm');
    // 获取切换按钮元素
    const button = document.querySelector('.toggle-btn');

    // 判断参数表单的显示状态
    if (form.style.display === 'none') {
      // 如果参数表单当前是隐藏状态，则将其显示，并将按钮文本改为“隐藏参数”
      form.style.display = 'block';
    //   button.textContent = '隐藏参数';
    } else {
      // 如果参数表单当前是显示状态，则将其隐藏，并将按钮文本改为“显示参数”
      form.style.display = 'none';
    //   button.textContent = '显示参数';
    }
  }
// 添加按钮事件监听器
document.getElementById('addWhiteBorder').addEventListener('click', addWhiteBorder);
document.getElementById('addBlurredBackground').addEventListener('click', addBlurredBackground);
document.getElementById('addDominantColor').addEventListener('click', addDominantColorBackground);

// 添加CSS动画效果
document.head.insertAdjacentHTML('beforeend', `
<style>
.viewfinder-frame.focusing::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 2px solid var(--accent-color);
    animation: focus 0.5s ease-out;
    pointer-events: none;
}

@keyframes focus {
    0% { opacity: 1; transform: scale(0.95); }
    100% { opacity: 0; transform: scale(1); }
}

.lcd-panel.updating {
    animation: lcd-update 0.3s ease-out;
}

@keyframes lcd-update {
    0% { opacity: 0.7; }
    50% { opacity: 0.9; }
    100% { opacity: 1; }
}
</style>
`);

// 初始化页面
window.addEventListener('DOMContentLoaded', () => {
    // 检查是否支持Web Audio API
    // try {
    //     const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    //     console.log('Web Audio API支持');
    // } catch (e) {
    //     console.log('Web Audio API不支持');
    // }
    
    // 初始化相机信息显示
    infoCamera.textContent = 'undetected';
    infoLens.textContent = 'undetected';
    infoSettings.textContent = 'undetected';
    infoTime.textContent = 'undetected';
    
    // 设置当前日期时间
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('dateTimeOriginal').value = `${year}-${month}-${day}T${hours}:${minutes}`;
});
