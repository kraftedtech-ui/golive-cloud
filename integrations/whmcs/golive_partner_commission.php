<?php
/**
 * GoLive Partner Network: tell the GoLive Cloud portal when an invoice is paid.
 *
 * Install:  copy this file to  <whmcs root>/includes/hooks/golive_partner_commission.php
 *           then paste the shared secret below (the same value as WHMCS_HOOK_SECRET
 *           on the portal). Keep this file readable by the web server only.
 *
 * On every paid invoice the hook reads the invoice and client with WHMCS's
 * internal API, signs the details, and posts them to the portal. The portal
 * records partner commission only for clients linked to a partner's won deal,
 * and ignores the rest. Domain items are excluded there, not here.
 *
 * Failures never affect the payment: they are written to the WHMCS Activity
 * Log (Utilities > Logs > Activity Log), prefixed "GoLive portal hook".
 */

if (!defined('WHMCS')) {
    die('This file cannot be accessed directly');
}

const GOLIVE_PORTAL_ENDPOINT = 'https://cloud.golivecompany.com/api/integrations/whmcs/invoice-paid';
const GOLIVE_PORTAL_HOOK_SECRET = 'PASTE_THE_SHARED_SECRET_HERE';

add_hook('InvoicePaid', 1, function ($vars) {
    try {
        if (GOLIVE_PORTAL_HOOK_SECRET === 'PASTE_THE_SHARED_SECRET_HERE' || GOLIVE_PORTAL_HOOK_SECRET === '') {
            logActivity('GoLive portal hook: secret not set, invoice #' . (int) $vars['invoiceid'] . ' not sent');
            return;
        }
        $invoiceId = (int) $vars['invoiceid'];
        $inv = localAPI('GetInvoice', ['invoiceid' => $invoiceId]);
        if (($inv['result'] ?? '') !== 'success') {
            logActivity("GoLive portal hook: GetInvoice failed for invoice #$invoiceId");
            return;
        }
        $details = localAPI('GetClientsDetails', ['clientid' => (int) $inv['userid'], 'stats' => false]);
        $client = $details['client'] ?? $details;

        $items = [];
        foreach (($inv['items']['item'] ?? []) as $it) {
            $items[] = [
                'type' => (string) ($it['type'] ?? ''),
                'description' => (string) ($it['description'] ?? ''),
                'amount' => (float) ($it['amount'] ?? 0),
                'relid' => (int) ($it['relid'] ?? 0),
            ];
        }

        $payload = json_encode([
            'invoiceId' => $invoiceId,
            'invoiceNum' => (string) ($inv['invoicenum'] ?? ''),
            'clientId' => (int) $inv['userid'],
            'companyName' => (string) ($client['companyname'] ?? ''),
            'email' => (string) ($client['email'] ?? ''),
            'currency' => (string) ($client['currency_code'] ?? ''),
            'datePaid' => (string) ($inv['datepaid'] ?? ''),
            'subtotal' => (float) ($inv['subtotal'] ?? 0),
            'tax' => (float) ($inv['tax'] ?? 0) + (float) ($inv['tax2'] ?? 0),
            'total' => (float) ($inv['total'] ?? 0),
            'items' => $items,
        ]);

        $ts = (string) time();
        $sig = hash_hmac('sha256', $ts . '.' . $payload, GOLIVE_PORTAL_HOOK_SECRET);

        $ch = curl_init(GOLIVE_PORTAL_ENDPOINT);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-GoLive-Timestamp: ' . $ts,
                'X-GoLive-Signature: ' . $sig,
            ],
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err = curl_error($ch);
        curl_close($ch);

        logActivity("GoLive portal hook: invoice #$invoiceId sent, HTTP $code"
            . ($err ? " ($err)" : '')
            . ($resp ? ' ' . substr((string) $resp, 0, 300) : ''));
    } catch (\Throwable $e) {
        logActivity('GoLive portal hook error: ' . $e->getMessage());
    }
});
