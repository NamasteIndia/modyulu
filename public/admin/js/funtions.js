function formart_datetime(timestamp, texttype) {
    var d = new Date(timestamp);
    var h = (d.getHours() < 10) ? `0${d.getHours()}` : d.getHours(),
        m = (d.getMinutes() < 10) ? `0${d.getMinutes()}` : d.getMinutes(),
        day = (d.getDate() < 10) ? `0${d.getDate()}` : d.getDate(),
        month = (d.getMonth() + 1 < 10) ? `0${d.getMonth() + 1}` : d.getMonth() + 1,
        year = d.getFullYear();
    if (texttype == "time")
        return ''.concat(h, ":", m);
    if (texttype == "full")
        return ''.concat(h, ":", m, " ", day, "/", month, "/", year);
    if (texttype == "day")
        return ''.concat(day, "/", month, "/", year);
    return "wrong texttype";
}

function createDataColumnToggleAajx(rowId, rowData, rowCol, tTitle, fTitle, inverse) {
    let icon = (rowData) ? `<i class="icon-status fas fa-toggle-on" title="${tTitle}">` : `<i class="icon-status fas fa-toggle-off" title="${fTitle}">`;
    return `<div data-id="${rowId}" data-col="${rowCol}" data-inverse="${inverse}" data-true="${tTitle}" data-false="${fTitle}" class="icon-status-wrap text-center">${icon}</div>`;
}

function createDataColumnToggle(rowData, tTitle, fTitle) {
    let icon = (rowData) ? `<i class="fas fa-toggle-on" title="${tTitle}">` : `<i class="fas fa-toggle-off" title="${fTitle}">`;
    return `<div class="icon-status-wrap text-center">${icon}</div>`;
}

function convert_slug(str) {
    // Chuyển hết sang chữ thường
    str = str.toLowerCase();
    // xóa dấu
    str = str.replace(/(à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ)/g, 'a');
    str = str.replace(/(è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ)/g, 'e');
    str = str.replace(/(ì|í|ị|ỉ|ĩ)/g, 'i');
    str = str.replace(/(ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ)/g, 'o');
    str = str.replace(/(ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ)/g, 'u');
    str = str.replace(/(ỳ|ý|ỵ|ỷ|ỹ)/g, 'y');
    str = str.replace(/(đ)/g, 'd');
    // Xóa ký tự đặc biệt 
    str = str.replace(/([^0-9a-z-\s])/g, '');
    // Xóa khoảng trắng thay bằng ký tự -
    str = str.replace(/(\s+)/g, '-');
    // xóa phần dự - ở đầu
    str = str.replace(/^-+/g, '');
    // xóa phần dư - ở cuối
    str = str.replace(/-+$/g, '');
    // return
    return str;
}

// Load data for seo progress bar
function setSeoProgress($el) {
    var valuenow = $el.val().length,
        $bar = $el.closest(".seo-progress-bar").find(".progress-bar"),
        valuegood = $bar.attr("aria-valuegood"),
        valuemax = $bar.attr("aria-valuemax"),
        width = Math.ceil(valuenow * 100 / valuemax);
    width = (width > 100) ? 100 : width;
    $bar.attr("aria-valuenow", valuenow);
    $bar.css({ "width": `${width}%` });
    $bar.text(`${valuenow} chars`);
    if (valuenow >= valuegood && valuenow <= valuemax) {
        $bar.addClass("good").removeClass("warning");
    } else {
        $bar.addClass("warning").removeClass("good");
    }
}