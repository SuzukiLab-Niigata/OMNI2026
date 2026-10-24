/* OMNI 2026 — email notice when a certificate of presentation is downloaded.

   The certificates page (assets/certificates.js) posts {code, name, lang} here after each download,
   and this script mails the organizer from their own Google account. Deploy it once:

     1. https://script.google.com → New project → paste this file → Save.
     2. Deploy → New deployment → type "Web app"
          Execute as: Me      Who has access: Anyone
        → Deploy, allow the permissions, copy the Web app URL (…/exec).
     3. Put that URL in NOTIFY_URL at the top of assets/certificates.js, commit and push.

   Only the 16 known certificate codes are accepted, so random posts to the URL do not send mail. */
var TO = 'kazuma3267@gmail.com';
var CODES = ['KA', 'KB', 'A-1', 'A-2', 'A-3', 'A-4', 'A-5', 'A-6', 'A-7', 'B-1', 'B-2', 'B-3', 'B-4', 'B-5', 'B-6', 'B-7'];

function doPost(e) {
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}
  var code = String(d.code || '');
  if (CODES.indexOf(code) < 0) return ContentService.createTextOutput('ignored');
  var name = String(d.name || '').slice(0, 120);
  var when = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm') + ' JST';
  MailApp.sendEmail({
    to: TO,
    subject: '[OMNI 2026] Certificate downloaded: ' + code + ' — ' + name,
    body: 'A certificate of presentation was downloaded from the OMNI 2026 website.\n\n' +
      'Presentation: ' + code + '\n' +
      'Presenter: ' + name + '\n' +
      'Page language: ' + String(d.lang || '').slice(0, 5) + '\n' +
      'Time: ' + when + '\n'
  });
  return ContentService.createTextOutput('ok');
}
