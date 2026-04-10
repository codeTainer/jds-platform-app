<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/swagger', '/api/documentation');
Route::view('/{any?}', 'app')->where('any', '^(?!api|swagger).*$');
