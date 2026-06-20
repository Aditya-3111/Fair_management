# WhatsApp Business API — Message Template Setup Guide

This system sends the field-work expense report to your company's WhatsApp number using the **Meta WhatsApp Business Cloud API**. You must create and get a template approved in **Meta Business Manager** before it can be sent automatically.

---

## Step 1: Create a Meta WhatsApp Business Account

1. Go to https://business.facebook.com/
2. Set up a **WhatsApp Business Platform** account (via Meta for Developers → My Apps → Add WhatsApp product).
3. Get your:
   - `WHATSAPP_PHONE_NUMBER_ID` (found in WhatsApp > API Setup)
   - `WHATSAPP_ACCESS_TOKEN` (temporary or permanent token — generate a permanent one via a System User for production)
4. Add these to your backend `.env` file.

---

## Step 2: Create the Message Template

Go to **Meta Business Manager → WhatsApp Manager → Message Templates → Create Template**.

### Template Settings:
- **Name:** `fair_expense_report` (must match `WHATSAPP_TEMPLATE_NAME` in `.env`)
- **Category:** Utility
- **Language:** English

### Template Body (copy exactly, with placeholders {{1}} to {{8}}):

```
📋 *{{1}} — Field Work Report*

*Work Title:* {{2}}
*Employee:* {{3}}
*Location:* {{4}}
*Started:* {{5}}
*Completed:* {{6}}

*Expense Details:*
{{7}}

💰 *Total Expense: {{8}}*

This is an auto-generated report from the Fair Management System.
```

### Sample values to submit for approval:
1. Venus Security
2. Security Coverage – Red Fort Fair
3. Ramesh Kumar
4. Red Fort, Delhi
5. 2026-06-15 09:00
6. 2026-06-15 18:30
7. 1. ₹500.00 - Travel\n2. ₹300.00 - Food
8. ₹800.00

Submit for review. Meta usually approves Utility templates within a few minutes to 24 hours.

---

## Step 3: Verify Your Company WhatsApp Number

In `.env`, set:
```
COMPANY_WHATSAPP_NUMBER=91XXXXXXXXXX
```
This is the number that will **receive** the reports (your company's WhatsApp number), in international format without `+` or spaces.

---

## Step 4: Test

1. Once the template status shows **Approved** in WhatsApp Manager, complete a field work in the Admin Panel.
2. Click **Send WhatsApp** — the system calls the Graph API `/messages` endpoint with your approved template.
3. Check the company WhatsApp number for the report message.

---

## Notes

- The PDF report (with logo, full expense table, and screenshots links) is generated separately and can be **downloaded/printed** from the Admin Panel — WhatsApp template messages cannot contain attachments unless you use a **Media Template** (requires hosting the PDF at a public URL and using a document header component). If you want the actual PDF file delivered via WhatsApp (not just text), let your developer know — it requires:
  1. Hosting the generated PDF at a public HTTPS URL (e.g., upload it to Cloudinary as a raw resource).
  2. Adding a `HEADER` component of type `DOCUMENT` to the template.
  3. Passing the PDF URL in the template header parameter when sending.
- Until then, the default setup sends a clean **text summary** report directly to your WhatsApp, and the full PDF (with logo + screenshots) is available for **download/print** in the Admin Panel.
