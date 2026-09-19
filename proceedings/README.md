# Proceedings — participants only

The proceedings PDF, the per-paper PDFs, the HTML versions (abstracts and text), the printed-page
images and the keynote abstracts are **published encrypted**. Visitors enter the seminar password on
the site; the browser decrypts the files locally (`assets/secure.js`). The programme, speakers,
titles, the poster and everything else stay public.

## Where things are

| Plaintext original (never committed, `private/` is in `.gitignore`) | Published, encrypted |
|---|---|
| `private/proceedings/OMNI2026_Proceedings.pdf` | `proceedings/OMNI2026_Proceedings.pdf.enc` |
| `private/papers/<id>.pdf` | `proceedings/papers/<id>.pdf.enc` |
| `private/pages/<id>-<n>.jpg` | `assets/pages/<id>-<n>.jpg.enc` |
| `private/papers-html/<id>.json` | `assets/papers-html/<id>.json.enc` |
| `private/secure-main.json` (keynote abstracts, EN/JA/TR) | `assets/secure/main.json.enc` |

`assets/secure/meta.json` holds the salt, the iteration count and a check value — no secret.

## Updating the book

1. Put the new PDF at `private/proceedings/OMNI2026_Proceedings.pdf`.
2. Re-cut the per-paper PDFs, page images and `private/papers-html/*.json` if pages moved
   (page ranges are in `assets/papers.js`).
3. Encrypt and publish:

   ```
   node tools/encrypt.mjs        # asks for the password (input hidden)
   git add -A && git commit -m "Update proceedings" && git push
   ```

The URLs and the QR codes never change.

## Changing the password

Run `node tools/encrypt.mjs` again with the new password and push. Every file is re-encrypted with a
fresh salt, so the old password stops working and visitors are asked for the new one.

## Limits

- Anyone who has the password can save a decrypted PDF and pass it on.
- Use a long password: the encrypted files are public, so a short one could be guessed offline.
- Never commit anything from `private/`.
