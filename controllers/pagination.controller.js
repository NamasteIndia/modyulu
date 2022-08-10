// Tạo pagination cho category và ringtones
exports.createPagination = async(url, curPage, maxPage) => {
    if (url.match(/\/page\/\d*/g)) {       
        url = url.replace(/\/page\/\d*/g, "");
    }
    var arrRs = [];
    var iconRight = `<svg xmlns="http://www.w3.org/2000/svg" width="11.555" height="12.094" viewBox="0 0 11.555 12.094">
                        <g transform="translate(0.705 0.705)">
                        <g transform="translate(3.883)">
                            <g transform="translate(0)">
                            <path d="M200.408,5.048,194.584,0l-.509.587,5.486,4.754L194.075,10.1l.509.587,5.824-5.048a.389.389,0,0,0,0-.587Z" transform="translate(-194.075)" stroke="#000" stroke-width="1"/>
                            </g>
                        </g>
                        <g transform="translate(0)">
                            <g transform="translate(0)">
                            <path d="M14.307,5.048,8.483,0,7.974.587,13.46,5.341,7.974,10.1l.509.587,5.824-5.048a.389.389,0,0,0,0-.587Z" transform="translate(-7.974)" stroke="#000" stroke-width="1"/>
                            </g>
                        </g>
                        </g>
                    </svg>`;
    var iconLeft = `<svg xmlns="http://www.w3.org/2000/svg" width="11.555" height="12.094" viewBox="0 0 11.555 12.094">
                        <g transform="translate(114.799 267.105) rotate(180)">
                        <g transform="translate(103.949 255.717)">
                            <g transform="translate(3.883)">
                            <g transform="translate(0)">
                                <path d="M200.408,5.048,194.584,0l-.509.587,5.486,4.754L194.075,10.1l.509.587,5.824-5.048a.389.389,0,0,0,0-.587Z" transform="translate(-194.075)" stroke="#000" stroke-width="1"/>
                            </g>
                            </g>
                            <g transform="translate(0)">
                            <g transform="translate(0)">
                                <path d="M14.307,5.048,8.483,0,7.974.587,13.46,5.341,7.974,10.1l.509.587,5.824-5.048a.389.389,0,0,0,0-.587Z" transform="translate(-7.974)" stroke="#000" stroke-width="1"/>
                            </g>
                            </g>
                        </g>
                        </g>
                    </svg>`;
    url = url.replace(/\/$/g, "");
    var arr = url.split("?");
    url = (arr.length >= 1) ? arr[0] : url;
    url = (url.match(/\/$/g)) ? url : `${url}/`;
    var sort = (arr.length >= 2) ? `?${arr[1]}` : "";
    if (maxPage <= 1) {
        return arrRs.join("");
    }
    if ((curPage - 1) > 3) {
        arrRs.push(`<li><a href="${url}page/${curPage - 1}${sort}" >${iconLeft}</a></li>`);
        arrRs.push(`<li><a href="${url}${sort}" >1</a>`);
        arrRs.push(`<li><span class="extend">…</span>`);
        arrRs.push(`<li><a href="${url}page/${curPage - 2}${sort}" >${curPage - 2}</a></li>`);
        arrRs.push(`<li><a href="${url}page/${curPage - 1}${sort}" >${curPage - 1}</a></li>`);
        arrRs.push(`<li class="active"><a href="${url}page/${curPage}${sort}">${curPage}</a></li>`);
    } else {
        for (let i = 1; i <= curPage; i++) {
            let tmp = (i == curPage) ? 'active' : '';
            let urlTmp = (i == 1) ? url : `${url}page/${i}`;
            arrRs.push(`<li class="${tmp}"><a href="${urlTmp}${sort}">${i}</a></li>`);
        }
        if (curPage > 1) {
            let urlTmp = ((curPage - 1) == 1) ? url : `${url}page/${(curPage - 1)}`;
            arrRs.unshift(`<li><a href="${urlTmp}${sort}" >${iconLeft}</a></li>`);
        }
    }
    if ((maxPage - curPage) > 3) {
        arrRs.push(`<li><a href="${url}page/${curPage + 1}${sort}" >${curPage + 1}</a></li>`);
        arrRs.push(`<li><a href="${url}page/${curPage + 2}${sort}" >${curPage + 2}</a></li>`);
        arrRs.push(`<li><span class="extend">…</span></li>`);
        arrRs.push(`<li><a href="${url}page/${maxPage}${sort}" >${maxPage}</a></li>`);
        arrRs.push(`<li><a href="${url}page/${curPage + 1}${sort}" >${iconRight}</a></li>`);
    } else {
        for (let i = curPage + 1; i <= maxPage; i++) {
            let tmp = (i == curPage) ? 'active' : '';
            arrRs.push(`<li class="${tmp}"><a href="${url}page/${i}${sort}">${i}</a></li>`);
        }
        if (curPage < maxPage) {
            arrRs.push(`<li><a href="${url}page/${curPage + 1}${sort}" >${iconRight}</a></li>`);
        }
    }
    return arrRs.join("");
}