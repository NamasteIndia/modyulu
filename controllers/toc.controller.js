var cheerio = require('cheerio');
function tableOfContents(content, ads, offads) {
    $ = cheerio.load(content, null, false);
    var h = hh = hhh = index = 1;
    var tocDom = [];
    var tocDomSchema = [];
    var ads3 = (ads.slot3) ? `<div class="ads"><p>SLOT 3</p>${ads.slot3}</div>` : "";
    var ads4 = (ads.slot4) ? `<div class="ads"><p>SLOT 4</p>${ads.slot4}</div>` : "";
    if(ads3.length<=0 && ads4.length>0){
        ads3 = ads4;
        ads4 = "";
    }
    var count = 1;
    $("h2, h3, h4").each(function() {
        var id = functions.convert_slug($(this).text());
        id = id.toLowerCase()+`-${count}`;
        count++;
        var anchor = "<a name='" + id + "'></a>";
        $(this).before(anchor);
        if ($(this).is("h2")) {
            tocDom.push(`<a class="lvl-h" href="#${id}"><span class="icon">${h}</span> ${$(this).text()}</a>`);
            h++;
            hh = hhh = 1;
        } else if ($(this).is("h3")) {
            tocDom.push(`<a class="lvl-hh" href="#${id}"><span class="icon">${h-1}.${hh}</span> ${$(this).text()}</a>`);
            hh++;
            hhh = 1;
        } else {
            tocDom.push(`<a class="lvl-hhh" href="#${id}"><span class="icon">${hh-1}.${hhh}</span> ${$(this).text()}</a>`);
            hhh++;
        }
        tocDomSchema.push(`${$(this).text()}`);
        index++;
    });
    if(ads3.length > 0 || ads4.length > 0){
        var lengthPContent = 0;
        var totalLengthContent = 0;
        var useShortCode = false;
        if(offads){
            ads3 = "";
            ads4 = "";
        }
        $("p, ul, ol").each(function(){
            let text = $(this).text();
            totalLengthContent += (text.length || 0);
            if(text.match(/\[ads1\]/g)){
                useShortCode = true;
                $(`${ads3}`).insertAfter($(this));
                $(this).remove();
            }
            if(text.match(/\[ads2\]/g)){
                useShortCode = true;
                $(`${ads4}`).insertAfter($(this));
                $(this).remove();
            }
        });
        if(!useShortCode && !offads){
            var isTwoAds = (totalLengthContent > 12 * 199) ? true : false;
            var doneSlot3 = false;
            var doneSlot4 = false;
            $("p, ul, ol").each(function(i, p){
                lengthPContent += ($(p).text().length || 0) ;
                let percentText = lengthPContent * 100 / totalLengthContent;
                if(!doneSlot3 && percentText >= 33){
                    $(`${ads3}`).insertAfter($(this));
                    doneSlot3 = !doneSlot3;
                }
                if(isTwoAds && !doneSlot4 && percentText >= 66){
                    $(`${ads4}`).insertAfter($(this));
                    doneSlot4 = !doneSlot4;
                }
            });
        }
    }
    return {
        toc: tocDom,
        schema: tocDomSchema,
        content: $.html()
    };
}

module.exports = {
    tableOfContents
}