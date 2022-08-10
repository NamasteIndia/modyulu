"use strict";
jQuery(document).ready(function() {
    var table = $('#datatable-sside');
    table.DataTable({
        responsive: false,
        searchDelay: 1000,
        processing: true,
        serverSide: true,
        dom: '<"top">t<"bottom"lp><"clear">',
        ajax: `/${dashboard}/logautoupdate/datatable`,
        columns: [
            { data: 'createdAt' },
            { data: 'postname' },            
            { 
                data: function(data, type, dataToSet) {
                    return `<div class="text-replace-style">                                
                                <span class="new">${data.newversion}</span>
                                <span class="old">${data.oldversion}</span>
                            </div>`;
                }
            },
            { 
                data: function(data, type, dataToSet) {
                    if(data.logtype!="success"){
                        return `<span class="bad">${data.oldtitle}</span>`;
                    }
                    var postLink = (data.post) ? data.post : {};
                    var redLink = `/${dashboard}/post/post-apk/edit/${data.postid}`;
                    redLink = (postLink.slug) ? `${domain}/${postLink.slug}/` : redLink;
                    return `<div class="text-replace-style">                                
                                <span class="new"><a target="_blank" href="${redLink}">${data.newtitle}</a></span>
                                <span class="old">${data.oldtitle}</span>
                            </div>`;
                }
            },
            { data: 'message' },
            { data: 'notes' }
        ],
        columnDefs: [{
            targets: 0,
            className: "text-center",
            render: function(data, type, full, meta) {
                var dateText = formart_datetime(data, "full");
                return dateText;
            },
        }],
        order: [0, 'DESC']
    });
    var oTable = $('#datatable-sside').DataTable();
});