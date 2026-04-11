<?php

return [
    'receipt_disk' => env('JDS_RECEIPT_DISK', 'public'),
    'idle_timeout_minutes' => (int) env('JDS_IDLE_TIMEOUT_MINUTES', 5),
];
