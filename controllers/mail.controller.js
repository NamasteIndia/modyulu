const config = require("config");
const mailCfJson = config.get("mailserver");
const formEmail = mailCfJson.email;
const mailCf = mailCfJson.zoho;
var nodemailer = require("nodemailer");

exports.mailVerifyRegister = (req, res) => {
    var smtpTransport = nodemailer.createTransport(mailCf);
    var mail = req.body.email || "";
    var nickname = req.body.nickname || "";
    var url = req.body.url || "";
    var mailOptions = {
        from: `${sitename} <${formEmail}>`,
        to: mail,
        subject: `${res.__('mailRegisterTitle')} ✔`,
        html: `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" width="100%">
                <tbody>
                    <tr>
                        <td align="center" style="color:#202124;font-family:Google Sans,&quot;Roboto&quot;,Arial;font-size:22px;font-weight:normal;line-height:44px;margin:0;padding:0 80px 0 80px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                            ${res.__('textHello')} ${nickname}!
                        </td>
                    </tr>               
                    <tr>
                        <td align="center" style="color:#3c4043;font-family:&quot;Roboto&quot;,OpenSans,&quot;Open Sans&quot;,Arial,sans-serif;font-size:16px;font-weight:normal;line-height:24px;margin:0;padding:0 70px 0 70px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                            ${res.__('mailRegisterMainText')}
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="color:#3c4043;font-family:&quot;Roboto&quot;,OpenSans,&quot;Open Sans&quot;,Arial,sans-serif;font-size:16px;font-weight:normal;line-height:24px;margin:0;padding:0 80px 0 80px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                            <a href="${url}">${url}</a>
                        </td>
                    </tr>
                </tbody>
            </table>`
    }
    smtpTransport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }
        smtpTransport.close();
    });
}

exports.mailRecoveryPassword = async(email, nickname, content, res) => {
    try{
        var smtpTransport = nodemailer.createTransport(mailCf);    
        var mailOptions = {
            from: `${sitename} <${formEmail}>`,
            to: email,
            subject: `${res.__('mailSendCodeRecoveryTitle')} ✔`,
            html: `<table role="presentation" border="0" cellspacing="0" cellpadding="0" align="center" width="100%">
                    <tbody>
                        <tr>
                            <td align="center" style="color:#202124;font-family:Google Sans,&quot;Roboto&quot;,Arial;font-size:22px;font-weight:normal;line-height:44px;margin:0;padding:0 80px 0 80px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                                ${res.__('textHello')} ${nickname}!
                            </td>
                        </tr>               
                        <tr>
                            <td align="center" style="color:#3c4043;font-family:&quot;Roboto&quot;,OpenSans,&quot;Open Sans&quot;,Arial,sans-serif;font-size:16px;font-weight:normal;line-height:24px;margin:0;padding:0 70px 0 70px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                                ${res.__('mailRecoveryPassContent')}
                            </td>
                        </tr>
                        <tr>
                            <td align="center" style="color:#3c4043;font-family:&quot;Roboto&quot;,OpenSans,&quot;Open Sans&quot;,Arial,sans-serif;font-size:16px;font-weight:normal;line-height:35px;margin:0;padding:0 80px 0 80px;text-align:center;word-break:normal;direction:ltr" dir="ltr">
                                <strong>${content}</strong>
                            </td>
                        </tr>
                    </tbody>
                </table>`
        }
        smtpTransport.sendMail(mailOptions, function(error, response){
            var rs = true;
            if(error){
                rs = false;
            }
            smtpTransport.close();
            return rs;
        });
    }catch(err){
        console.log(err)
    }
}