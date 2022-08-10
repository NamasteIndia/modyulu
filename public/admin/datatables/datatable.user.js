"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">', // off search box
        ajax: `/${dashboard}/user/datatable/`,
        columns: [
            { 
                data: function(data, type, dataToSet) {
                    if(data.roledel == true || data.mine == data.author){
                        return '<input type="checkbox" name="id[]" value="' + $('<div/>').text(data.id).html() + '">';
                    }
                    return "";
                }
            },
            { data: 'avatar' },
            {
                data: function(data, type, dataToSet) {
                    var domRoleHtml = '';
                    if(data.roleedit == true || data.id == data.mine || data.author == data.mine){
                        domRoleHtml += `<a class="btnDTR btn-load-modal-edit" data-id="${data.id}" href="javascript:void(0);">Edit</a>`;
                    }
                    if(data.roledel == true || data.author == data.mine){
                        domRoleHtml += `<a class="btnDTR btnDTRDanger btnDTRDelete" data-id="${data.id}" href="/${dashboard}/user/delete/${data.id}">Delete</a>`;
                    }
                    return `<div class="row-name">${data.username}</div>
                            <div class="row-actions">${domRoleHtml}</div>`;
                }
            },
            { data: 'nickname' },
            {
                data: function(data, type, dataToSet) {
                    var roleName = (data.role) ? data.role.rolename : '';
                    return roleName;
                }
            },
            { data: 'phone' },
            { data: 'email' },
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, data.isactive, "isactive", "Active", "UnActive", false);
                }
            },
            {
                data: function(data, type, dataToSet) {
                    return createDataColumnToggleAajx(data.id, !data.isblock, "isblock", "Enable", "Disable", true);
                }
            },
            { data: 'createdAt' }
        ],
        columnDefs: [{
            'targets': 0,
            'searchable': false,
            'orderable': false,
            'className': 'dt-body-center'
        },{
            targets: 1,
            orderable: false,
            render: function(data, type, full, meta) {
                var img = data;
                if (data === undefined || data === null) {
                    img = domain + "/" + dashboard + "/assets/img/avatar.jpeg";
                }
                return `<img width="30px" height="30px" src="${img}" alt="Avatar" class="rounded">`;
            },
        }, {
            targets: 9,
            className: "text-right",
            render: function(data, type, full, meta) {
                var dateText = formart_datetime(data, "full");
                return dateText;
            },
        }],
        order: [
            [0, "desc"]
        ]
    });
    var oTable = $('#datatable-sside').DataTable();
});