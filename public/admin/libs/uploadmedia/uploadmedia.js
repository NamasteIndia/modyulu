$(function() {
    // Open file choose
    $(".um-wrapper button").on("click", function(e) {
        e.preventDefault();
        $(this).closest(".um-wrapper").find('input[type="file"]').trigger("click");
    });
    // Disable dragover drop event on page
    $("html").on("dragover", function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(".um-wrapper").addClass("here");
    });
    $("html").on("drop", function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(".um-wrapper").removeClass("here").removeClass("right");
    });
    $('html').on('dragleave', function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(".um-wrapper").removeClass("here").removeClass("right");
    });
    $('.um-area').on('dragenter', function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).closest(".um-wrapper").removeClass("here").addClass("right");
    });
    $('.um-area').on('dragover', function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).closest(".um-wrapper").removeClass("here").addClass("right");
    });
    $('.um-area').on('dragleave', function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).closest(".um-wrapper").addClass("here").removeClass("right");
    });
    // Drop on upload area
    $('.um-area').on('drop', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var files = e.originalEvent.dataTransfer.files;
        var fd = new FormData();
        $.each(files, function(indx, file) {
            fd.append("file", file);
        });
        $(this).closest(".um-wrapper").removeClass("here").removeClass("right");
        umSendData2SS(files);
    });
    // Choose files action
    $('.um-wrapper input[type="file"]').on("change", function(e) {
        var fd = new FormData();
        var files = $(this)[0].files;
        $.each(files, function(indx, file) {
            fd.append("file", file);
        });
        $(this).closest(".um-wrapper").removeClass("here").removeClass("right");
        umSendData2SS(files);
    });
});
// Upload files
function umSendData2SS(files) {
    $.each(files, function(indx, file) {
        var fd = new FormData();
        fd.append('file', file);
        $.ajax({
            url: `/${dashboard}/media/single`,
            type: 'post',
            enctype: 'multipart/form-data',
            data: fd,
            cache: false,
            contentType: false,
            processData: false,
            success: function(res) {
                var $mediaitem = '';
                if (res.code == 0) {
                    $mediaitem = `<div class="media-item">
                        <div class="status"><span class="badge badge-danger">Error: ${res.message}</span></div>
                        <div class="filename">${file.name}</div>
                    </div>`;
                } else {
                    var url = `/${dashboard}/assets/img/icon-file-150.png`;
                    url = res.data.urlicon;
                    $mediaitem = `<div class="media-item">
                        <img class="thumbnail" width="50px" height="50px" src="${url}"/>       
                        <div class="status"><span class="badge badge-success">Ok</span></div>
                        <div class="filename">
                            <span>${res.data.title}</span>
                            <strong>${res.data.filename}<strong>
                        </div>                        
                    </div>`;
                }
                $("#um-results").prepend($mediaitem);
                $.each($("#um-results img"), function(indx, img) {
                    $(img).attr("src", $(img).attr("src"));
                });
            }
        });
    });
}