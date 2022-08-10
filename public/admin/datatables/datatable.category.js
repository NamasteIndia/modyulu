"use strict";
jQuery(document).ready(function() {
    $('#datatable-sside').DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">', // off search box
        ajax: `/${dashboard}/category/${catetype}/datatable/`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    //console.log(data)
                    if(data.roledel == true || data.mine == data.author){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            {
                data: function(data, type, dataToSet) {                    
                    var domRoleHtml = '';
                    var fullslug = (data.fullslug) ? data.fullslug : "";
                    var arr = fullslug.split("/");
                    var sep = "";
                    arr.forEach(function(a, indx){
                        if(indx>0) sep+="—";
                    });
                    if(data.roleedit == true || data.mine == data.author){
                        domRoleHtml += `<a target="_blank" class="btnDTR" href="/${dashboard}/category/${catetype}/edit/${data.id}">Edit</a>`;
                    }
                    if(data.roledel == true || data.mine == data.author){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" href="/${dashboard}/category/${catetype}/delete/${data.id}">Delete</a>`;
                    }
                    return `<div class="row-name">${sep}${data.title}</div>
                            <div class="row-actions">
                                <a target="_blank" class="btnDTR" href="/${data.permalink}">View</a>
                                ${domRoleHtml}
                            </div>`;
                }
            },
            { data: 'slug' },
            { 
                data: function(data, type, dataToSet) {
                    if(data.Author){
                        return `<a href="javascript:void(0);">${data.Author.username}</a>`;
                    }
                    return "";
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
            { data: 'pcount' },
            { data: 'offads' },
            { data: 'islikemain' },
            { data: 'allowfollow' },
            { data: 'allowindex' },
            { data: 'catestatus' },
            { data: 'updatedAt' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        }, {
            targets: 6,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Show Ads in page" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="Hidden Ads in page" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 7,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Content like main language" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="Content must be declared" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 8,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Follow" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="No Follow" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 9,
            orderable: false,
            render: function(data, type, full, meta) {
                if (data) {
                    return `<div class="text-center"><div aria-hidden="true" title="Index" class="score-icon good"></div></div>`;
                } else {
                    return `<div class="text-center"><div aria-hidden="true" title="No Index" class="score-icon"></div></div>`;
                }
            },
        }, {
            targets: 10,
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
            targets: 11,
            className: "text-right",
            render: function(data, type, full, meta) {
                var dateText = formart_datetime(data, "full");
                return dateText;
            },
        }],
        order: [
            [11, "DESC"]
        ]
    });
    var oTable = $('#datatable-sside').DataTable();    
});