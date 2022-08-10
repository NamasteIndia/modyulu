"use strict";
jQuery(document).ready(function() {
    $('#datatable-sside').DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">', // off search box
        ajax: `/${dashboard}/post/${posttype}/datatable/`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true || data.mine == data.author){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit == true || data.mine == data.author){
                        domRoleHtml = `<a target="_blank" class="btnDTR" href="/${dashboard}/post/${posttype}/file/${data.id}">Upload Mp3</a>
                                        <a target="_blank" class="btnDTR" href="/${dashboard}/post/${posttype}/edit/${data.id}">Edit</a>`;
                    }
                    return `<div class="row-name">${data.title}</div>
                            <div class="row-actions">
                                <a target="_blank" class="btnDTR" href="/ringtones/${data.slug}">View</a>
                                ${domRoleHtml}
                            </div>`;
                }
            },
            {
                data: function(data, type, dataToSet) {
                    if (data.Author != null) {
                        return `<a href="javascript:void(0);" alt="${data.Author.username}">${data.Author.username}</a>`;
                    }
                    return '';
                }
            },
            {
                data: function(data, type, dataToSet) {
                    if (data.Ads != null) {
                        return data.Ads.name;
                    }
                    return '';
                }
            },
            {
                data: function(data, type, dataToSet) {
                    let offall = data.offadsall || false;
                    if(offall){
                        return `<div aria-hidden="true" title="Off All" class="score-icon"></div>`;
                    }else{
                        let dom = '<div class="colAdsFrame">';
                        let offen = data.offads || false;
                        if(offen) dom += `<div class="adsStatus"><img src="/${dashboard}/assets/img/flags/us.png"><span class="off" title="Off en"></span></div>`;
                        else dom += `<div class="adsStatus"><img src="/${dashboard}/assets/img/flags/us.png"><span class="on" title="On en"></span></div>`;
                        let langs = (data.PostLang) ? data.PostLang : [];
                        langs.forEach(l => {
                            let off = l.offadslang || false;
                            if(off) dom += `<div class="adsStatus"><img src="/${dashboard}/assets/img/flags/${l.langid}.png"><span class="off" title="Off ${l.langid}"></span></div>`;
                            else dom += `<div class="adsStatus"><img src="/${dashboard}/assets/img/flags/${l.langid}.png"><span class="on" title="On ${l.langid}"></span></div>`;
                        });
                        dom += '</div>';
                        return dom;
                    }
                }
            },
            { data: 'islikemain' },
            { data: 'allowfollow' },
            { data: 'allowindex' },
            { data: 'poststatus' },
            { data: 'modifiedat' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            targets: 5,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="All languages" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="None languages" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 6,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Follow" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="No Follow" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 7,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Index" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="No Index" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 8,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data == "published")
                    return `<div class="text-center"><div aria-hidden="true" title="Publish" class="score-icon good"></div></div>`;
                if (data == "pending")
                    return `<div class="text-center"><div aria-hidden="true" title="Pending" class="score-icon"></div></div>`;
                if (data == "trash")
                    return `<div class="text-center"><div aria-hidden="true" title="Trash" class="score-icon bad"></div></div>`;
                return `<div class="text-center"><div aria-hidden="true" title="Unknow" class="score-icon"></div></div>`;
            },
        }, {
            targets: 9,
            render: function(data, type, full, meta) {
                var dateText = formart_datetime(data, "full");
                return `<div class="text-right">${dateText}</div>`;
            },
        }],
        order: [
            [9, "desc"]
        ]
    });
    var oTable = $('#datatable-sside').DataTable();    
});